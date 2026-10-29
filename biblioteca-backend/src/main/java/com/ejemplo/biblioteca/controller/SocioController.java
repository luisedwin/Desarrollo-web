package com.ejemplo.biblioteca.controller;

import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.service.SocioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/socios")
public class SocioController {

    private final SocioService socioService;

    public SocioController(SocioService socioService) {
        this.socioService = socioService;
    }

    @GetMapping
    public List<Socio> listar() {
        return socioService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public Socio obtenerPorId(@PathVariable Long id) {
        return socioService.obtenerPorId(id);
    }

    @PostMapping
    public ResponseEntity<Socio> crear(@RequestBody Socio socio) {
        return ResponseEntity.status(HttpStatus.CREATED).body(socioService.crear(socio));
    }

    @PutMapping("/{id}")
    public Socio actualizar(@PathVariable Long id, @RequestBody Socio socio) {
        return socioService.actualizar(id, socio);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        socioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
