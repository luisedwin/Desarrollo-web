package com.ejemplo.biblioteca.controller;

import com.ejemplo.biblioteca.dto.EjemplarRequest;
import com.ejemplo.biblioteca.model.Ejemplar;
import com.ejemplo.biblioteca.model.EstadoEjemplar;
import com.ejemplo.biblioteca.service.EjemplarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ejemplares")
public class EjemplarController {

    private final EjemplarService ejemplarService;

    public EjemplarController(EjemplarService ejemplarService) {
        this.ejemplarService = ejemplarService;
    }

    // GET /api/v1/ejemplares?libroId=1&estado=DISPONIBLE (filtros opcionales)
    @GetMapping
    public List<Ejemplar> listar(@RequestParam(required = false) Long libroId,
                                 @RequestParam(required = false) EstadoEjemplar estado) {
        return ejemplarService.obtenerTodos(libroId, estado);
    }

    @GetMapping("/{id}")
    public Ejemplar obtenerPorId(@PathVariable Long id) {
        return ejemplarService.obtenerPorId(id);
    }

    @PostMapping
    public ResponseEntity<Ejemplar> crear(@RequestBody EjemplarRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ejemplarService.crear(datos));
    }

    @PutMapping("/{id}")
    public Ejemplar actualizar(@PathVariable Long id, @RequestBody EjemplarRequest datos) {
        return ejemplarService.actualizar(id, datos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        ejemplarService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
