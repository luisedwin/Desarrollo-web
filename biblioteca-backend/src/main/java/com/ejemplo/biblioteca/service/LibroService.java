package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.model.Libro;
import com.ejemplo.biblioteca.repository.LibroRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class LibroService {

    private final LibroRepository libroRepository;

    public LibroService(LibroRepository libroRepository) {
        this.libroRepository = libroRepository;
    }

    public List<Libro> obtenerTodos() {
        return libroRepository.findAll();
    }

    public Libro obtenerPorId(Long id) {
        return libroRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Libro no encontrado con ID: " + id));
    }

    public Libro crear(Libro libro) {
        if (libro.getTitulo() == null || libro.getTitulo().trim().isEmpty()) {
            throw new IllegalArgumentException("El título no puede estar vacío");
        }
        libro.setId(null);
        normalizarIsbn(libro);
        return libroRepository.save(libro);
    }

    public Libro actualizar(Long id, Libro datosActualizados) {
        if (!libroRepository.existsById(id)) {
            throw new NoSuchElementException("No se puede actualizar. Libro inexistente con ID: " + id);
        }
        datosActualizados.setId(id);
        normalizarIsbn(datosActualizados);
        return libroRepository.save(datosActualizados);
    }

    // El ISBN es único en la BD: un ISBN vacío se guarda como null para no chocar entre libros sin ISBN
    private void normalizarIsbn(Libro libro) {
        if (libro.getIsbn() != null && libro.getIsbn().trim().isEmpty()) {
            libro.setIsbn(null);
        }
    }

    public void eliminar(Long id) {
        if (!libroRepository.existsById(id)) {
            throw new NoSuchElementException("No se puede eliminar. Libro inexistente con ID: " + id);
        }
        libroRepository.deleteById(id);
    }
}