#version 300 es
precision highp float;

uniform float dispersion;
uniform float fresnelPow;

in vec3 vNormal;
in vec3 vViewPosition;

out vec4 fragColor;

vec3 sky(vec3 dir)
{
    float t = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 horizon = vec3(0.85, 0.9, 1.0);
    vec3 zenith  = vec3(0.06, 0.09, 0.18);
    vec3 col = mix(horizon, zenith, t);
    float sun = pow(max(dot(dir, normalize(vec3(0.4, 0.6, 0.3))), 0.0), 64.0);
    col += vec3(1.0, 0.95, 0.8) * sun * 1.5;
    return col;
}

void main()
{
    vec3 normal  = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 I = -viewDir;

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPow);
    fresnel = mix(0.05, 1.0, fresnel);

    vec3 reflColor = sky(reflect(I, normal));

    float base = 1.0 / 1.15;
    vec3 refrColor;
    refrColor.r = sky(refract(I, normal, base)).r;
    refrColor.g = sky(refract(I, normal, base - dispersion * 0.5)).g;
    refrColor.b = sky(refract(I, normal, base - dispersion)).b;

    vec3 color = mix(refrColor, reflColor, fresnel);

    vec3 lightDir = normalize(vec3(0.4, 0.6, 0.3));
    vec3 halfDir  = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 200.0);
    color += vec3(1.0) * spec;

    color *= vec3(0.96, 0.99, 1.06);
    fragColor = vec4(color, 1.0);
}
