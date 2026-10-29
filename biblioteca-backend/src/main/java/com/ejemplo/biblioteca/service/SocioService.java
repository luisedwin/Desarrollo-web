package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.repository.SocioRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class SocioService {

    private final SocioRepository socioRepository;

    public SocioService(SocioRepository socioRepository) {
        this.socioRepository = socioRepository;
    }

    public List<Socio> obtenerTodos() {
        return socioRepository.findAll(Sort.by("apellido", "nombre"));
    }

    public Socio obtenerPorId(Long id) {
        return socioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Socio no encontrado con ID: " + id));
    }

    public Socio crear(Socio socio) {
        validar(socio);
        socio.setId(null);
        socio.setFechaRegistro(LocalDate.now());
        if (socio.getActivo() == null) {
            socio.setActivo(true);
        }
        return socioRepository.save(socio);
    }

    public Socio actualizar(Long id, Socio datos) {
        Socio existente = obtenerPorId(id);
        validar(datos);
        datos.setId(id);
        datos.setFechaRegistro(existente.getFechaRegistro());
        if (datos.getActivo() == null) {
            datos.setActivo(existente.getActivo());
        }
        return socioRepository.save(datos);
    }

    public void eliminar(Long id) {
        if (!socioRepository.existsById(id)) {
            throw new NoSuchElementException("No se puede eliminar. Socio inexistente con ID: " + id);
        }
        socioRepository.deleteById(id);
    }

    private void validar(Socio socio) {
        if (vacio(socio.getNombre()) || vacio(socio.getApellido())) {
            throw new IllegalArgumentException("El nombre y el apellido son obligatorios");
        }
        if (vacio(socio.getDocumento())) {
            throw new IllegalArgumentException("El documento es obligatorio");
        }
        // email es único en la BD: vacío se guarda como null para no chocar entre socios sin email
        if (vacio(socio.getEmail())) {
            socio.setEmail(null);
        }
    }

    private boolean vacio(String texto) {
        return texto == null || texto.trim().isEmpty();
    }
}
