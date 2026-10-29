package com.ejemplo.biblioteca.repository;

import com.ejemplo.biblioteca.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {

    Optional<Socio> findByDocumento(String documento);
}
