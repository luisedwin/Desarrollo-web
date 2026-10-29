package com.ejemplo.biblioteca.repository;

import com.ejemplo.biblioteca.model.Libro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Spring Data JPA genera la implementación (findAll, findById, save, existsById, deleteById...)
@Repository
public interface LibroRepository extends JpaRepository<Libro, Long> {
}
