#version 300 es

// Geometria bazowa (per-vertex, wspólna dla wszystkich instancji)
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

// Dane per-instancję (divisor = 1)
layout(location = 2) in mat4 instanceModel;     // zajmuje lokalizacje 2,3,4,5 - statyczna rotacja+skala
layout(location = 6) in vec3 instancePos;       // pozycja kryształu w scenie
layout(location = 7) in vec4 instanceAxisSpeed; // xyz = oś ciągłego obrotu, w = mnożnik prędkości

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 sceneRotation;   // powolny obrót całej sceny (grupy kryształów)
uniform float uTime;          // czas skumulowany
uniform float baseAngularSpeed; // bazowa prędkość kątowa obrotu pojedynczego kryształu (rad/s)
uniform float explode;

out vec3 vNormal;
out vec3 vViewPosition;

// Macierz rotacji Rodriguesa wokół dowolnej osi
mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c,          oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
        oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z + axis.x * s,
        oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
    );
}

void main()
{
    // Ciągły, indywidualny obrót kryształu wokół jego własnej osi
    mat3 spin = rotationMatrix(instanceAxisSpeed.xyz, uTime * baseAngularSpeed * instanceAxisSpeed.w);

    // Statyczna rotacja + skala nadana przy generowaniu sceny
    mat3 staticRotScale = mat3(instanceModel);

    mat3 objectRotation = spin * staticRotScale;

    // Pozycja lokalna kryształu -> pozycja świata (przed globalnym obrotem sceny)
    vec3 worldPosLocal = objectRotation * position + instancePos * explode;
    vec4 worldPos = sceneRotation * vec4(worldPosLocal, 1.0);

    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;

    // Ponieważ sceneRotation i spin to czyste (ortogonalne) rotacje, a skala jest jednorodna,
    // ta sama macierz kierunkowa nadaje się też do transformacji normalnej.
    mat3 fullRotation = mat3(sceneRotation) * objectRotation;
    vNormal = normalize(mat3(viewMatrix) * fullRotation * normal);
}
