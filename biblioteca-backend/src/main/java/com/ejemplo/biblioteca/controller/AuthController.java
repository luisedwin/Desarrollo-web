package com.ejemplo.biblioteca.controller;

import com.ejemplo.biblioteca.dto.AuthResponse;
import com.ejemplo.biblioteca.dto.LoginRequest;
import com.ejemplo.biblioteca.dto.RegistroRequest;
import com.ejemplo.biblioteca.dto.UsuarioActual;
import com.ejemplo.biblioteca.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest datos) {
        return authService.login(datos);
    }

    // Crea una cuenta de lector (rol USUARIO) y devuelve el token para entrar directamente
    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registro(@RequestBody RegistroRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(datos));
    }

    // Datos del usuario dueño del token
    @GetMapping("/yo")
    public UsuarioActual yo(@AuthenticationPrincipal Jwt jwt) {
        return authService.obtenerActual(jwt.getSubject());
    }
}
