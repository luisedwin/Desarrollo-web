package com.ejemplo.biblioteca.controller;

import com.ejemplo.biblioteca.dto.PrestamoRequest;
import com.ejemplo.biblioteca.model.Prestamo;
import com.ejemplo.biblioteca.service.PrestamoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prestamos")
public class PrestamoController {

    private final PrestamoService prestamoService;

    public PrestamoController(PrestamoService prestamoService) {
        this.prestamoService = prestamoService;
    }

    // GET /api/v1/prestamos?activos=true para ver solo los que no se han devuelto
    @GetMapping
    public List<Prestamo> listar(@RequestParam(defaultValue = "false") boolean activos) {
        return prestamoService.obtenerTodos(activos);
    }

    // Préstamos del usuario que inició sesión (el email sale del token, no del cliente)
    @GetMapping("/mios")
    public List<Prestamo> misPrestamos(@AuthenticationPrincipal Jwt jwt) {
        return prestamoService.obtenerDelUsuario(jwt.getSubject());
    }

    @PostMapping
    public ResponseEntity<Prestamo> crear(@RequestBody PrestamoRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prestamoService.crear(datos));
    }

    @PostMapping("/{id}/devolucion")
    public Prestamo registrarDevolucion(@PathVariable Long id) {
        return prestamoService.registrarDevolucion(id);
    }
}
