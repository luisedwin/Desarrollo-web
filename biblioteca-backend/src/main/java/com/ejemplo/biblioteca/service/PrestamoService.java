package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.dto.PrestamoRequest;
import com.ejemplo.biblioteca.model.Ejemplar;
import com.ejemplo.biblioteca.model.EstadoEjemplar;
import com.ejemplo.biblioteca.model.EstadoPrestamo;
import com.ejemplo.biblioteca.model.Prestamo;
import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.model.Usuario;
import com.ejemplo.biblioteca.repository.EjemplarRepository;
import com.ejemplo.biblioteca.repository.PrestamoRepository;
import com.ejemplo.biblioteca.repository.SocioRepository;
import com.ejemplo.biblioteca.repository.UsuarioRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PrestamoService {

    private final PrestamoRepository prestamoRepository;
    private final EjemplarRepository ejemplarRepository;
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;

    public PrestamoService(PrestamoRepository prestamoRepository,
                           EjemplarRepository ejemplarRepository,
                           SocioRepository socioRepository,
                           UsuarioRepository usuarioRepository) {
        this.prestamoRepository = prestamoRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.socioRepository = socioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Prestamo> obtenerTodos(boolean soloActivos) {
        return prestamoRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaPrestamo", "id")).stream()
                .filter(p -> !soloActivos || p.getFechaDevolucionReal() == null)
                .toList();
    }

    public List<Prestamo> obtenerDelUsuario(String email) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        if (usuario.getSocio() == null) {
            return List.of();
        }
        return prestamoRepository.findBySocioIdOrderByFechaPrestamoDescIdDesc(usuario.getSocio().getId());
    }

    // Todo ocurre en una sola transacción: si algo falla, no se guarda nada
    @Transactional
    public Prestamo crear(PrestamoRequest datos) {
        if (datos.socioId() == null || datos.ejemplarId() == null) {
            throw new IllegalArgumentException("Debes elegir el socio y el ejemplar");
        }
        LocalDate hoy = LocalDate.now();
        if (datos.fechaDevolucionPrevista() == null || datos.fechaDevolucionPrevista().isBefore(hoy)) {
            throw new IllegalArgumentException("La fecha de devolución debe ser hoy o una fecha futura");
        }

        Socio socio = socioRepository.findById(datos.socioId())
                .orElseThrow(() -> new NoSuchElementException("Socio no encontrado con ID: " + datos.socioId()));
        if (!Boolean.TRUE.equals(socio.getActivo())) {
            throw new IllegalStateException("El socio está inactivo y no puede pedir préstamos");
        }

        // Bloquea el ejemplar hasta terminar la transacción (validación concurrente)
        Ejemplar ejemplar = ejemplarRepository.findByIdParaActualizar(datos.ejemplarId())
                .orElseThrow(() -> new NoSuchElementException("Ejemplar no encontrado con ID: " + datos.ejemplarId()));
        if (ejemplar.getEstado() != EstadoEjemplar.DISPONIBLE) {
            throw new IllegalStateException("El ejemplar " + ejemplar.getCodigo() + " no está disponible");
        }

        ejemplar.setEstado(EstadoEjemplar.PRESTADO);
        ejemplarRepository.save(ejemplar);

        Prestamo prestamo = new Prestamo(null, ejemplar, socio, datos.fechaDevolucionPrevista());
        prestamo.setFechaPrestamo(hoy);
        return prestamoRepository.save(prestamo);
    }

    @Transactional
    public Prestamo registrarDevolucion(Long id) {
        Prestamo prestamo = prestamoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Préstamo no encontrado con ID: " + id));
        if (prestamo.getFechaDevolucionReal() != null) {
            throw new IllegalStateException("Este préstamo ya fue devuelto");
        }

        prestamo.setFechaDevolucionReal(LocalDate.now());
        prestamo.setEstado(EstadoPrestamo.DEVUELTO);

        Ejemplar ejemplar = prestamo.getEjemplar();
        ejemplar.setEstado(EstadoEjemplar.DISPONIBLE);
        ejemplarRepository.save(ejemplar);

        return prestamoRepository.save(prestamo);
    }
}
