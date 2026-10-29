package com.ejemplo.biblioteca.dto;

import com.ejemplo.biblioteca.model.Rol;

import java.time.Instant;

// Respuesta del login/registro: el token JWT y los datos que necesita mostrar el frontend
public record AuthResponse(String token, Instant expiraEn, String email, String nombre, Rol rol) {
}
