#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

layout(location = 2) in mat4 instanceModel;     
layout(location = 6) in vec3 instancePos;       
layout(location = 7) in vec4 instanceAxisSpeed; 

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 sceneRotation;   
uniform float uTime;          
uniform float baseAngularSpeed; 
uniform float explode;

out vec3 vNormal;
out vec3 vViewPosition;

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
    
    mat3 spin = rotationMatrix(instanceAxisSpeed.xyz, uTime * baseAngularSpeed * instanceAxisSpeed.w);

    mat3 staticRotScale = mat3(instanceModel);

    mat3 objectRotation = spin * staticRotScale;

    vec3 worldPosLocal = objectRotation * position + instancePos * explode;
    vec4 worldPos = sceneRotation * vec4(worldPosLocal, 1.0);

    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;

    mat3 fullRotation = mat3(sceneRotation) * objectRotation;
    vNormal = normalize(mat3(viewMatrix) * fullRotation * normal);
}
