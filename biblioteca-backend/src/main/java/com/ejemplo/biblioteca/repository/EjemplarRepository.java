package com.ejemplo.biblioteca.repository;

import com.ejemplo.biblioteca.model.Ejemplar;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EjemplarRepository extends JpaRepository<Ejemplar, Long> {

    // SELECT ... FOR UPDATE: bloquea la fila mientras se registra un préstamo,
    // así dos peticiones simultáneas no pueden prestar el mismo ejemplar
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Ejemplar e where e.id = :id")
    Optional<Ejemplar> findByIdParaActualizar(@Param("id") Long id);
}
