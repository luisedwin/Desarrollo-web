package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.dto.PrestamoRequest;
import com.ejemplo.biblioteca.model.Ejemplar;
import com.ejemplo.biblioteca.model.EstadoEjemplar;
import com.ejemplo.biblioteca.model.EstadoPrestamo;
import com.ejemplo.biblioteca.model.Libro;
import com.ejemplo.biblioteca.model.Prestamo;
import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.repository.EjemplarRepository;
import com.ejemplo.biblioteca.repository.PrestamoRepository;
import com.ejemplo.biblioteca.repository.SocioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrestamoServiceTest {

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private EjemplarRepository ejemplarRepository;

    @Mock
    private SocioRepository socioRepository;

    @InjectMocks
    private PrestamoService prestamoService;

    private Socio socio;
    private Ejemplar ejemplar;
    private final LocalDate enDosSemanas = LocalDate.now().plusDays(14);

    @BeforeEach
    void setUp() {
        socio = new Socio(1L, "Ana", "Torres", "70123456", "ana@correo.com", null);
        Libro libro = new Libro(1L, "Clean Code", "Robert C. Martin", "978-0132350884", 2008);
        ejemplar = new Ejemplar(1L, libro, "CC-001", EstadoEjemplar.DISPONIBLE, "Estante B3");
    }

    @Test
    @DisplayName("Debe registrar el préstamo y marcar el ejemplar como PRESTADO")
    void debeCrearPrestamo() {
        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(ejemplarRepository.findByIdParaActualizar(1L)).thenReturn(Optional.of(ejemplar));
        when(prestamoRepository.save(any(Prestamo.class))).thenAnswer(inv -> inv.getArgument(0));

        Prestamo resultado = prestamoService.crear(new PrestamoRequest(1L, 1L, enDosSemanas));

        assertEquals(EstadoEjemplar.PRESTADO, ejemplar.getEstado());
        assertEquals(EstadoPrestamo.ACTIVO, resultado.getEstado());
        assertEquals(LocalDate.now(), resultado.getFechaPrestamo());
        assertFalse(resultado.isVencido());
    }

    @Test
    @DisplayName("No debe prestar un ejemplar que no está disponible")
    void noDebePrestarEjemplarNoDisponible() {
        ejemplar.setEstado(EstadoEjemplar.PRESTADO);
        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(ejemplarRepository.findByIdParaActualizar(1L)).thenReturn(Optional.of(ejemplar));

        assertThrows(IllegalStateException.class,
                () -> prestamoService.crear(new PrestamoRequest(1L, 1L, enDosSemanas)));
        verify(prestamoRepository, never()).save(any());
    }

    @Test
    @DisplayName("No debe prestar a un socio inactivo")
    void noDebePrestarASocioInactivo() {
        socio.setActivo(false);
        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));

        assertThrows(IllegalStateException.class,
                () -> prestamoService.crear(new PrestamoRequest(1L, 1L, enDosSemanas)));
        verify(prestamoRepository, never()).save(any());
    }

    @Test
    @DisplayName("No debe aceptar una fecha de devolución en el pasado")
    void noDebeAceptarFechaPasada() {
        assertThrows(IllegalArgumentException.class,
                () -> prestamoService.crear(new PrestamoRequest(1L, 1L, LocalDate.now().minusDays(1))));
        verifyNoInteractions(prestamoRepository);
    }

    @Test
    @DisplayName("La devolución debe liberar el ejemplar")
    void debeRegistrarDevolucion() {
        ejemplar.setEstado(EstadoEjemplar.PRESTADO);
        Prestamo prestamo = new Prestamo(5L, ejemplar, socio, enDosSemanas);
        when(prestamoRepository.findById(5L)).thenReturn(Optional.of(prestamo));
        when(prestamoRepository.save(any(Prestamo.class))).thenAnswer(inv -> inv.getArgument(0));

        Prestamo resultado = prestamoService.registrarDevolucion(5L);

        assertEquals(EstadoPrestamo.DEVUELTO, resultado.getEstado());
        assertEquals(LocalDate.now(), resultado.getFechaDevolucionReal());
        assertEquals(EstadoEjemplar.DISPONIBLE, ejemplar.getEstado());
    }

    @Test
    @DisplayName("No debe devolver dos veces el mismo préstamo")
    void noDebeDevolverDosVeces() {
        Prestamo prestamo = new Prestamo(5L, ejemplar, socio, enDosSemanas);
        prestamo.setFechaDevolucionReal(LocalDate.now());
        when(prestamoRepository.findById(5L)).thenReturn(Optional.of(prestamo));

        assertThrows(IllegalStateException.class, () -> prestamoService.registrarDevolucion(5L));
    }

    @Test
    @DisplayName("Un préstamo sin devolver con fecha pasada está vencido")
    void debeDetectarPrestamoVencido() {
        Prestamo prestamo = new Prestamo(5L, ejemplar, socio, LocalDate.now().minusDays(3));
        assertTrue(prestamo.isVencido());
    }
}
