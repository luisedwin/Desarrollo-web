package com.ejemplo.biblioteca.dto;

import com.ejemplo.biblioteca.model.Rol;

public record UsuarioActual(String email, String nombre, Rol rol) {
}
