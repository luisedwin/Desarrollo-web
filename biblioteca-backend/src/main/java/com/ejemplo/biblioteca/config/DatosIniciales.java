package com.ejemplo.biblioteca.config;

import com.ejemplo.biblioteca.model.Libro;
import com.ejemplo.biblioteca.model.Rol;
import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.model.Usuario;
import com.ejemplo.biblioteca.repository.LibroRepository;
import com.ejemplo.biblioteca.repository.SocioRepository;
import com.ejemplo.biblioteca.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

// Datos mínimos al arrancar: libros de ejemplo (si no hay), cuenta de administrador y cuenta de usuario lector
@Component
public class DatosIniciales implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);

    private final LibroRepository libroRepository;
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DatosIniciales(LibroRepository libroRepository,
                          UsuarioRepository usuarioRepository,
                          SocioRepository socioRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.admin.email:}") String adminEmail,
                          @Value("${app.admin.password:}") String adminPassword) {
        this.libroRepository = libroRepository;
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        crearLibrosDeEjemplo();
        crearAdministrador();
        crearUsuarioLector();
    }

    private void crearLibrosDeEjemplo() {
        if (libroRepository.count() > 0) {
            return;
        }
        libroRepository.saveAll(List.of(
                new Libro(null, "Cien Años de Soledad", "Gabriel García Márquez", "978-0307474728", 1967),
                new Libro(null, "Clean Code", "Robert C. Martin", "978-0132350884", 2008),
                new Libro(null, "El Quijote", "Miguel de Cervantes", "978-8424116286", 1605)
        ));
    }

    private void crearAdministrador() {
        if (usuarioRepository.existsByRol(Rol.ADMIN)) {
            return;
        }
        if (adminEmail.isBlank() || adminPassword.length() < 8) {
            log.warn("No hay administrador: define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en el .env");
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        usuarioRepository.save(new Usuario(email, passwordEncoder.encode(adminPassword), Rol.ADMIN, null));
        log.info("Cuenta de administrador creada: {}", email);
    }

    private void crearUsuarioLector() {
        String email = "usuario@biblioteca.com";
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        Socio socio = socioRepository.findByDocumento("80000000").orElseGet(() ->
                socioRepository.save(new Socio(null, "Usuario", "Lector", "80000000", email, "999888777"))
        );
        usuarioRepository.save(new Usuario(email, passwordEncoder.encode("usuario1234"), Rol.USUARIO, socio));
        log.info("Cuenta de usuario lector creada: {}", email);
    }
}
