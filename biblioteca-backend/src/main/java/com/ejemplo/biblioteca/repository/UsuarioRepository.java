package com.ejemplo.biblioteca.repository;

import com.ejemplo.biblioteca.model.Rol;
import com.ejemplo.biblioteca.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRol(Rol rol);

    boolean existsBySocioId(Long socioId);
}
