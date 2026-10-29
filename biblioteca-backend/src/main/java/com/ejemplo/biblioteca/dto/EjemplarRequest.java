package com.ejemplo.biblioteca.dto;

import com.ejemplo.biblioteca.model.EstadoEjemplar;

// Datos que envía el frontend para crear o editar un ejemplar (el libro va solo por su ID)
public record EjemplarRequest(Long libroId, String codigo, EstadoEjemplar estado, String ubicacion) {
}
