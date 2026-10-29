package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.dto.EjemplarRequest;
import com.ejemplo.biblioteca.model.Ejemplar;
import com.ejemplo.biblioteca.model.EstadoEjemplar;
import com.ejemplo.biblioteca.model.Libro;
import com.ejemplo.biblioteca.repository.EjemplarRepository;
import com.ejemplo.biblioteca.repository.LibroRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EjemplarService {

    private final EjemplarRepository ejemplarRepository;
    private final LibroRepository libroRepository;

    public EjemplarService(EjemplarRepository ejemplarRepository, LibroRepository libroRepository) {
        this.ejemplarRepository = ejemplarRepository;
        this.libroRepository = libroRepository;
    }

    // Ambos filtros son opcionales
    public List<Ejemplar> obtenerTodos(Long libroId, EstadoEjemplar estado) {
        return ejemplarRepository.findAll(Sort.by("codigo")).stream()
                .filter(e -> libroId == null || e.getLibro().getId().equals(libroId))
                .filter(e -> estado == null || e.getEstado() == estado)
                .toList();
    }

    public Ejemplar obtenerPorId(Long id) {
        return ejemplarRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ejemplar no encontrado con ID: " + id));
    }

    public Ejemplar crear(EjemplarRequest datos) {
        validar(datos);
        EstadoEjemplar estado = datos.estado() != null ? datos.estado() : EstadoEjemplar.DISPONIBLE;
        if (estado == EstadoEjemplar.PRESTADO) {
            throw new IllegalArgumentException("Un ejemplar nuevo no puede estar prestado; registra un préstamo");
        }
        Ejemplar ejemplar = new Ejemplar(null, buscarLibro(datos.libroId()), datos.codigo().trim(), estado, datos.ubicacion());
        return ejemplarRepository.save(ejemplar);
    }

    public Ejemplar actualizar(Long id, EjemplarRequest datos) {
        Ejemplar ejemplar = obtenerPorId(id);
        validar(datos);
        EstadoEjemplar nuevoEstado = datos.estado() != null ? datos.estado() : ejemplar.getEstado();

        // El estado PRESTADO solo lo cambian los préstamos y las devoluciones
        if (ejemplar.getEstado() == EstadoEjemplar.PRESTADO && nuevoEstado != EstadoEjemplar.PRESTADO) {
            throw new IllegalStateException("El ejemplar está prestado; registra la devolución primero");
        }
        if (ejemplar.getEstado() != EstadoEjemplar.PRESTADO && nuevoEstado == EstadoEjemplar.PRESTADO) {
            throw new IllegalStateException("Para prestar un ejemplar registra un préstamo");
        }

        ejemplar.setLibro(buscarLibro(datos.libroId()));
        ejemplar.setCodigo(datos.codigo().trim());
        ejemplar.setEstado(nuevoEstado);
        ejemplar.setUbicacion(datos.ubicacion());
        return ejemplarRepository.save(ejemplar);
    }

    public void eliminar(Long id) {
        if (!ejemplarRepository.existsById(id)) {
            throw new NoSuchElementException("No se puede eliminar. Ejemplar inexistente con ID: " + id);
        }
        ejemplarRepository.deleteById(id);
    }

    private void validar(EjemplarRequest datos) {
        if (datos.libroId() == null) {
            throw new IllegalArgumentException("Debes elegir el libro del ejemplar");
        }
        if (datos.codigo() == null || datos.codigo().trim().isEmpty()) {
            throw new IllegalArgumentException("El código del ejemplar es obligatorio");
        }
    }

    private Libro buscarLibro(Long libroId) {
        return libroRepository.findById(libroId)
                .orElseThrow(() -> new NoSuchElementException("Libro no encontrado con ID: " + libroId));
    }
}
