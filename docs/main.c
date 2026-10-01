#include <GLES3/gl3.h>
#include <stdio.h>
#include <GLFW/glfw3.h>
#include <cglm/cglm.h>
#define _USE_MATH_DEFINES
#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <float.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

float base_speed = 0.6f;
bool explode_play = false;
float explode_mul = 1.0f;
float explode_max = 5.0f;
float explode_htime = 2.0f;
float explode_tcount = 0.0f;

EXPORT void changeRotSpeed(float multiplier)
{
    base_speed = multiplier;
}
static float explodeCurve(float t)
{
    float k = t / explode_htime;
    float x = (k <= 1.0f) ? k : 2.0f - k;
    return 1.0f + (explode_max - 1.0f) * x;
}

EXPORT void explode()
{
    if (explode_play && explode_tcount > explode_htime)
    {
        explode_tcount = 2.0f * explode_htime - explode_tcount;
    }
    else
        explode_play = true;
}
GLuint createShaderProgram(const char *vertexShaderSource, const char *fragmentShaderSource);
char *readTextFile(const char *path);
void CreateCrystalScene(GLfloat *outModelMatrices, GLfloat *outPositions, GLfloat *outAxisSpeed);
float frand(float min, float max);
void animateExplosion();

GLFWwindow *window = NULL;
GLuint CrystalProgram;

GLuint VAO;
GLuint VBO_pos, VBO_normal;
GLuint VBO_model, VBO_instPos, VBO_axisSpeed;
GLint uViewLoc, uProjLoc, uSceneRotLoc, uTimeLoc, uBaseSpeedLoc, uDisLoc, uFresLoc, uExplode;

vec3 eye = {0.0f, 0.0f, 60.0f};
vec3 up = {0.0f, 1.0f, 0.0f};
mat4 view, proj;

mat4 sceneRotation;
float sceneAngle = 0.0f;
float totalTime = 0.0f;
float dt = 0.0f;

unsigned int seed;

const int v_num = 12;
GLfloat crystalPositions[] = {
    1.0f,
    -1.0f,
    -1.0f,
    -1.0f,
    -1.0f,
    1.0f,
    -1.0f,
    1.0f,
    -1.0f,

    1.0f,
    1.0f,
    1.0f,
    -1.0f,
    1.0f,
    -1.0f,
    -1.0f,
    -1.0f,
    1.0f,

    1.0f,
    1.0f,
    1.0f,
    -1.0f,
    -1.0f,
    1.0f,
    1.0f,
    -1.0f,
    -1.0f,

    1.0f,
    1.0f,
    1.0f,
    1.0f,
    -1.0f,
    -1.0f,
    -1.0f,
    1.0f,
    -1.0f,
};
GLfloat crystalNormals[] = {
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,
    -0.57735f,

    -0.57735f,
    0.57735f,
    0.57735f,
    -0.57735f,
    0.57735f,
    0.57735f,
    -0.57735f,
    0.57735f,
    0.57735f,

    -0.57735f,
    0.57735f,
    -0.57735f,
    -0.57735f,
    0.57735f,
    -0.57735f,
    -0.57735f,
    0.57735f,
    -0.57735f,

    0.57735f,
    0.57735f,
    -0.57735f,
    0.57735f,
    0.57735f,
    -0.57735f,
    0.57735f,
    0.57735f,
    -0.57735f,
};

const int c_num = 300;

GLfloat *instanceModelMatrices = NULL;
GLfloat *instancePositions = NULL;
GLfloat *instanceAxisSpeed = NULL;

void main_loop(void)
{
    dt = glfwGetTime();
    glfwSetTime(0);
    totalTime += dt;

    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glViewport(0, 0, 1920, 1080);

    sceneAngle += dt * 15.0f * (float)M_PI / 180.0f;
    glm_mat4_identity(sceneRotation);
    glm_rotate(sceneRotation, sceneAngle, (vec3){0.0f, 1.0f, 0.0f});

    if (explode_play)
    {
        animateExplosion();
    }
    glUseProgram(CrystalProgram);
    glUniformMatrix4fv(uViewLoc, 1, GL_FALSE, (float *)view);
    glUniformMatrix4fv(uProjLoc, 1, GL_FALSE, (float *)proj);
    glUniformMatrix4fv(uSceneRotLoc, 1, GL_FALSE, (float *)sceneRotation);
    glUniform1f(uTimeLoc, totalTime);
    glUniform1f(uBaseSpeedLoc, base_speed);
    glUniform1f(uDisLoc, 0.05f);
    glUniform1f(uFresLoc, 3.0f);
    glUniform1f(uExplode, explode_mul);

    glBindVertexArray(VAO);
    glDrawArraysInstanced(GL_TRIANGLES, 0, v_num, c_num);
    glBindVertexArray(0);

    glfwSwapBuffers(window);
    glfwPollEvents();
}

int main()
{
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    window = glfwCreateWindow(1920, 1080, "Tidal Simulation by Kuba Chmura", NULL, NULL);
    if (window == NULL)
    {
        printf("Error creating a window\n");
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glViewport(0, 0, 1920, 1080);
    glEnable(GL_DEPTH_TEST);
    glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glfwSwapBuffers(window);

    seed = 36817936u;
    srand(seed);

    instanceModelMatrices = malloc(sizeof(GLfloat) * 16 * c_num);
    instancePositions = malloc(sizeof(GLfloat) * 3 * c_num);
    instanceAxisSpeed = malloc(sizeof(GLfloat) * 4 * c_num);

    CreateCrystalScene(instanceModelMatrices, instancePositions, instanceAxisSpeed);

    char *vertexSrc = readTextFile("shaders/crystal.vert.glsl");
    char *fragmentSrc = readTextFile("shaders/crystal.frag.glsl");
    CrystalProgram = createShaderProgram(vertexSrc, fragmentSrc);
    free(vertexSrc);
    free(fragmentSrc);

    glGenVertexArrays(1, &VAO);
    glBindVertexArray(VAO);

    // --- Geometria bazowa (per-vertex, divisor = 0) ---
    glGenBuffers(1, &VBO_pos);
    glBindBuffer(GL_ARRAY_BUFFER, VBO_pos);
    glBufferData(GL_ARRAY_BUFFER, sizeof(crystalPositions), crystalPositions, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(GLfloat), (void *)0);
    glEnableVertexAttribArray(0);

    glGenBuffers(1, &VBO_normal);
    glBindBuffer(GL_ARRAY_BUFFER, VBO_normal);
    glBufferData(GL_ARRAY_BUFFER, sizeof(crystalNormals), crystalNormals, GL_STATIC_DRAW);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(GLfloat), (void *)0);
    glEnableVertexAttribArray(1);

    // --- Dane per-instancję (divisor = 1) ---
    glGenBuffers(1, &VBO_model);
    glBindBuffer(GL_ARRAY_BUFFER, VBO_model);
    glBufferData(GL_ARRAY_BUFFER, sizeof(GLfloat) * 16 * c_num, instanceModelMatrices, GL_STATIC_DRAW);
    for (int i = 0; i < 4; i++)
    {
        GLuint loc = 2 + i;
        glVertexAttribPointer(loc, 4, GL_FLOAT, GL_FALSE, 16 * sizeof(GLfloat), (void *)(i * 4 * sizeof(GLfloat)));
        glEnableVertexAttribArray(loc);
        glVertexAttribDivisor(loc, 1);
    }

    glGenBuffers(1, &VBO_instPos);
    glBindBuffer(GL_ARRAY_BUFFER, VBO_instPos);
    glBufferData(GL_ARRAY_BUFFER, sizeof(GLfloat) * 3 * c_num, instancePositions, GL_STATIC_DRAW);
    glVertexAttribPointer(6, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(GLfloat), (void *)0);
    glEnableVertexAttribArray(6);
    glVertexAttribDivisor(6, 1);

    glGenBuffers(1, &VBO_axisSpeed);
    glBindBuffer(GL_ARRAY_BUFFER, VBO_axisSpeed);
    glBufferData(GL_ARRAY_BUFFER, sizeof(GLfloat) * 4 * c_num, instanceAxisSpeed, GL_STATIC_DRAW);
    glVertexAttribPointer(7, 4, GL_FLOAT, GL_FALSE, 4 * sizeof(GLfloat), (void *)0);
    glEnableVertexAttribArray(7);
    glVertexAttribDivisor(7, 1);

    glBindVertexArray(0);

    uViewLoc = glGetUniformLocation(CrystalProgram, "viewMatrix");
    uProjLoc = glGetUniformLocation(CrystalProgram, "projectionMatrix");
    uSceneRotLoc = glGetUniformLocation(CrystalProgram, "sceneRotation");
    uTimeLoc = glGetUniformLocation(CrystalProgram, "uTime");
    uBaseSpeedLoc = glGetUniformLocation(CrystalProgram, "baseAngularSpeed");
    uDisLoc = glGetUniformLocation(CrystalProgram, "dispersion");
    uFresLoc = glGetUniformLocation(CrystalProgram, "fresnelPow");
    uExplode = glGetUniformLocation(CrystalProgram, "explode");

    glfwSetTime(0);
    glm_perspective(glm_rad(45.0f), 1920.0f / 1080.0f, 2.0f, 155.0f, proj);
    glm_lookat(eye, (vec3){0.0f, 0.0f, -1.0f}, up, view);

#ifdef __EMSCRIPTEN__
    emscripten_set_main_loop(main_loop, 0, 1);
#else
    while (!glfwWindowShouldClose(window))
        main_loop();

    glfwDestroyWindow(window);
    glfwTerminate();
#endif

    free(instanceModelMatrices);
    free(instancePositions);
    free(instanceAxisSpeed);
    return 0;
}

char *readTextFile(const char *path)
{
    FILE *f = fopen(path, "rb");
    if (!f)
    {
        printf("Nie udalo sie otworzyc pliku: %s\n", path);
        exit(1);
    }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *buffer = malloc(size + 1);
    size_t read = fread(buffer, 1, size, f);
    buffer[read] = '\0';
    fclose(f);
    return buffer;
}

GLuint createShaderProgram(const char *vertexShaderSource, const char *fragmentShaderSource)
{
    GLuint vertex_shader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertex_shader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertex_shader);
    GLint vert_success;
    glGetShaderiv(vertex_shader, GL_COMPILE_STATUS, &vert_success);
    if (!vert_success)
    {
        char log[512];
        glGetShaderInfoLog(vertex_shader, 512, NULL, log);
        printf("VERT ERROR: %s\n", log);
    }

    GLuint fragment_shader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragment_shader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragment_shader);
    GLint frag_success;
    glGetShaderiv(fragment_shader, GL_COMPILE_STATUS, &frag_success);
    if (!frag_success)
    {
        char log[512];
        glGetShaderInfoLog(fragment_shader, 512, NULL, log);
        printf("FRAG ERROR: %s\n", log);
    }

    GLuint shader_program = glCreateProgram();
    glAttachShader(shader_program, vertex_shader);
    glAttachShader(shader_program, fragment_shader);
    glLinkProgram(shader_program);

    GLint link_success;
    glGetProgramiv(shader_program, GL_LINK_STATUS, &link_success);
    if (!link_success)
    {
        char log[512];
        glGetProgramInfoLog(shader_program, 512, NULL, log);
        printf("LINK ERROR: %s\n", log);
    }

    glDeleteShader(vertex_shader);
    glDeleteShader(fragment_shader);
    return shader_program;
}

float frand(float min, float max)
{
    return min + ((float)rand() / (float)RAND_MAX * (max - min));
}

// Generuje dla każdej instancji: statyczną macierz modelu (losowa rotacja startowa + skala),
// pozycję na "skorupie" wokół centrum (rozmieszczanie z odrzucaniem kolizji, jak w oryginale)
// oraz oś i prędkość ciągłego obrotu, animowanego później w vertex shaderze.
void CreateCrystalScene(GLfloat *outModelMatrices, GLfloat *outPositions, GLfloat *outAxisSpeed)
{
    const float minShellRadius = 20.0f;
    const float maxShellRadius = 45.0f;

    vec3 *placedPositions = malloc(c_num * sizeof(vec3));
    float *placedRadii = malloc(c_num * sizeof(float));

    for (int c = 0; c < c_num; c++)
    {
        vec3 pos;
        float scale = 1.0f;
        float myRadius = 0.0f;
        int attempts = 0;
        bool placedOk = false;

        while (!placedOk && attempts < 30)
        {
            scale = frand(0.5f, 1.0f);

            vec3 dir;
            dir[0] = frand(-1.0f, 1.0f);
            dir[1] = frand(-1.0f, 1.0f);
            dir[2] = frand(-1.0f, 1.0f);
            glm_normalize(dir);

            float shellRadius = frand(minShellRadius, maxShellRadius);
            pos[0] = dir[0] * shellRadius;
            pos[1] = dir[1] * shellRadius;
            pos[2] = dir[2] * shellRadius;

            myRadius = 1.73f * scale;

            placedOk = true;
            for (int prev = 0; prev < c; prev++)
            {
                float dx = pos[0] - placedPositions[prev][0];
                float dy = pos[1] - placedPositions[prev][1];
                float dz = pos[2] - placedPositions[prev][2];
                float dist = sqrtf(dx * dx + dy * dy + dz * dz);
                float minDist = myRadius + placedRadii[prev];

                if (dist < minDist)
                {
                    placedOk = false;
                    break;
                }
            }
            attempts++;
        }

        glm_vec3_copy(pos, placedPositions[c]);
        placedRadii[c] = myRadius;

        // Statyczna rotacja startowa + skala, zapisywana raz do instanceModel
        float initAngle = frand(0.0f, 2.0f * (float)M_PI);
        vec3 initAxis;
        initAxis[0] = frand(-1.0f, 1.0f);
        initAxis[1] = frand(-1.0f, 1.0f);
        initAxis[2] = frand(-1.0f, 1.0f);
        glm_normalize(initAxis);

        mat4 model;
        glm_mat4_identity(model);
        glm_rotate(model, initAngle, initAxis);
        glm_scale_uni(model, scale);
        memcpy(outModelMatrices + c * 16, model, 16 * sizeof(GLfloat));

        outPositions[c * 3 + 0] = pos[0];
        outPositions[c * 3 + 1] = pos[1];
        outPositions[c * 3 + 2] = pos[2];

        // Oś i prędkość ciągłego obrotu (animowanego w shaderze na podstawie uTime)
        vec3 spinAxis;
        spinAxis[0] = frand(-1.0f, 1.0f);
        spinAxis[1] = frand(-1.0f, 1.0f);
        spinAxis[2] = frand(-1.0f, 1.0f);
        glm_normalize(spinAxis);

        float speedSign = (rand() % 2 == 0) ? 1.0f : -1.0f;
        float speedMag = frand(0.4f, 1.2f);

        outAxisSpeed[c * 4 + 0] = spinAxis[0];
        outAxisSpeed[c * 4 + 1] = spinAxis[1];
        outAxisSpeed[c * 4 + 2] = spinAxis[2];
        outAxisSpeed[c * 4 + 3] = speedSign * speedMag;
    }

    free(placedPositions);
    free(placedRadii);
}

void animateExplosion()
{
    explode_tcount += dt;
    if (explode_tcount >= 2.0f * explode_htime)
    {
        explode_play = false;
        explode_tcount = 0.0f;
        explode_mul = 1.0f;
    }
    else
    {
        explode_mul = explodeCurve(explode_tcount);
    }
}