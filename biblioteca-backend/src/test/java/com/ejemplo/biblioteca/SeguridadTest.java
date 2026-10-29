package com.ejemplo.biblioteca;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Prueba de integración: levanta la app completa (con H2) y verifica quién puede hacer qué
@SpringBootTest
@AutoConfigureMockMvc
class SeguridadTest {

    @Autowired
    private MockMvc mockMvc;

    private String login(String email, String password) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    private String registrar(String documento, String email) throws Exception {
        String cuerpo = """
                {"nombre":"Lucía","apellido":"Pérez","documento":"%s","email":"%s","password":"lectora-123"}
                """.formatted(documento, email);
        String respuesta = mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    @Test
    @DisplayName("Sin token no se puede consultar la API")
    void sinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/v1/libros")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Login con contraseña incorrecta devuelve 401")
    void loginIncorrecto() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("El admin puede gestionar todo")
    void adminTieneAccesoTotal() throws Exception {
        String token = login("admin@test.com", "admin-pruebas-123");

        mockMvc.perform(get("/api/v1/socios").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/libros").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Rayuela\",\"autor\":\"Julio Cortázar\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/auth/yo").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    @DisplayName("Un usuario registrado ve el catálogo y sus préstamos, pero no puede modificar")
    void usuarioSoloLectura() throws Exception {
        String token = registrar("40000001", "lucia@test.com");

        mockMvc.perform(get("/api/v1/libros").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/ejemplares").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/prestamos/mios").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/socios").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/prestamos").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/libros").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Intento\",\"autor\":\"X\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("No se puede registrar dos veces el mismo email")
    void emailDuplicado() throws Exception {
        registrar("40000002", "repetido@test.com");
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Otro","apellido":"Más","documento":"40000003",
                                 "email":"repetido@test.com","password":"otra-clave-1"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Un token falso es rechazado")
    void tokenFalso() throws Exception {
        mockMvc.perform(get("/api/v1/libros").header("Authorization", "Bearer token.inventado.123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("El usuario lector inicial puede autenticarse y tiene sus permisos acotados")
    void usuarioInicialPuedeAutenticarse() throws Exception {
        String token = login("usuario@biblioteca.com", "usuario1234");
        mockMvc.perform(get("/api/v1/auth/yo").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andExpect(jsonPath("$.email").value("usuario@biblioteca.com"));

        // Puede consultar catálogo y ejemplares
        mockMvc.perform(get("/api/v1/libros").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Tiene denegada la gestión administrativa
        mockMvc.perform(get("/api/v1/socios").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("El administrador NO puede autocompletar usando la contraseña de usuario")
    void adminNoPuedeUsarPasswordDeAutocompletado() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"usuario1234\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cualquier correo de usuario registrado permite autocompletar")
    void cualquierUsuarioPermiteAutocompletar() throws Exception {
        // Registramos un usuario con una contraseña propia diferente
        registrar("40000099", "persona.nueva@test.com");

        // Autocompleta exitosamente con usuario1234
        String token = login("persona.nueva@test.com", "usuario1234");
        mockMvc.perform(get("/api/v1/auth/yo").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andExpect(jsonPath("$.email").value("persona.nueva@test.com"));
    }
}
