package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.model.Libro;
import com.ejemplo.biblioteca.repository.LibroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LibroServiceTest {

    @Mock
    private LibroRepository libroRepository;

    @InjectMocks
    private LibroService libroService;

    private Libro libroEjemplo;

    @BeforeEach
    void setUp() {
        libroEjemplo = new Libro(1L, "Clean Code", "Robert C. Martin", "978-0132350884", 2008);
    }

    @Test
    @DisplayName("Debe listar todos los libros almacenados")
    void debeListarTodosLosLibros() {
        when(libroRepository.findAll()).thenReturn(Collections.singletonList(libroEjemplo));

        List<Libro> resultado = libroService.obtenerTodos();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Clean Code", resultado.get(0).getTitulo());
        verify(libroRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Debe retornar un libro cuando el ID existe")
    void debeRetornarLibroCuandoExisteId() {
        when(libroRepository.findById(1L)).thenReturn(Optional.of(libroEjemplo));

        Libro resultado = libroService.obtenerPorId(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("Robert C. Martin", resultado.getAutor());
        verify(libroRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Debe lanzar excepción si el libro a consultar no existe")
    void debeLanzarExcepcionCuandoIdNoExiste() {
        when(libroRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> libroService.obtenerPorId(99L));
        verify(libroRepository, times(1)).findById(99L);
    }

    @Test
    @DisplayName("Debe guardar un libro con ID generado")
    void debeCrearLibroExitosamente() {
        Libro nuevo = new Libro(null, "Design Patterns", "GoF", "978-0201633610", 1994);
        Libro guardado = new Libro(2L, "Design Patterns", "GoF", "978-0201633610", 1994);

        when(libroRepository.save(any(Libro.class))).thenReturn(guardado);

        Libro resultado = libroService.crear(nuevo);

        assertNotNull(resultado.getId());
        assertEquals("Design Patterns", resultado.getTitulo());
        verify(libroRepository, times(1)).save(nuevo);
    }

    @Test
    @DisplayName("Debe guardar el ISBN vacío como null para no violar el índice único")
    void debeNormalizarIsbnVacio() {
        Libro sinIsbn = new Libro(null, "Libro sin ISBN", "Autor X", "  ", 2020);
        when(libroRepository.save(any(Libro.class))).thenAnswer(inv -> inv.getArgument(0));

        Libro resultado = libroService.crear(sinIsbn);

        assertNull(resultado.getIsbn());
    }

    @Test
    @DisplayName("Debe fallar al crear si el título está vacío")
    void debeLanzarErrorSiTituloEsInvalido() {
        Libro invalido = new Libro(null, "   ", "Autor X", "12345", 2020);

        assertThrows(IllegalArgumentException.class, () -> libroService.crear(invalido));
        verify(libroRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe actualizar libro cuando el ID existe")
    void debeActualizarLibroExitosamente() {
        Libro cambios = new Libro(null, "Clean Code 2nd Ed", "Robert C. Martin", "978-0132350884", 2024);
        Libro actualizadoEsperado = new Libro(1L, "Clean Code 2nd Ed", "Robert C. Martin", "978-0132350884", 2024);

        when(libroRepository.existsById(1L)).thenReturn(true);
        when(libroRepository.save(any(Libro.class))).thenReturn(actualizadoEsperado);

        Libro resultado = libroService.actualizar(1L, cambios);

        assertEquals(1L, resultado.getId());
        assertEquals("Clean Code 2nd Ed", resultado.getTitulo());
        verify(libroRepository, times(1)).existsById(1L);
        verify(libroRepository, times(1)).save(cambios);
    }

    @Test
    @DisplayName("Debe eliminar libro si existe en el almacenamiento")
    void debeEliminarLibroExitosamente() {
        when(libroRepository.existsById(1L)).thenReturn(true);

        assertDoesNotThrow(() -> libroService.eliminar(1L));
        verify(libroRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Debe lanzar excepción al intentar eliminar un ID inexistente")
    void debeLanzarErrorAlEliminarIdInexistente() {
        when(libroRepository.existsById(99L)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () -> libroService.eliminar(99L));
        verify(libroRepository, never()).deleteById(anyLong());
    }
}