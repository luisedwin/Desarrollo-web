package com.ejemplo.biblioteca.dto;

import java.time.LocalDate;

// Datos que envía el frontend para registrar un préstamo
public record PrestamoRequest(Long ejemplarId, Long socioId, LocalDate fechaDevolucionPrevista) {
}
