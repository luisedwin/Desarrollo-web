package com.ejemplo.biblioteca.dto;

// Datos del formulario "Crear cuenta": crea (o vincula) la ficha de socio y la cuenta de usuario
public record RegistroRequest(String nombre, String apellido, String documento,
                              String email, String telefono, String password) {
}
