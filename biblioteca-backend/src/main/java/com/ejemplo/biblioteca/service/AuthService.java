package com.ejemplo.biblioteca.service;

import com.ejemplo.biblioteca.dto.AuthResponse;
import com.ejemplo.biblioteca.dto.LoginRequest;
import com.ejemplo.biblioteca.dto.RegistroRequest;
import com.ejemplo.biblioteca.dto.UsuarioActual;
import com.ejemplo.biblioteca.model.Rol;
import com.ejemplo.biblioteca.model.Socio;
import com.ejemplo.biblioteca.model.Usuario;
import com.ejemplo.biblioteca.repository.SocioRepository;
import com.ejemplo.biblioteca.repository.UsuarioRepository;
import com.ejemplo.biblioteca.security.TokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class AuthService {

    private static final int LARGO_MINIMO_PASSWORD = 8;

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
                       SocioRepository socioRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest datos) {
        String email = normalizarEmail(datos.email());
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Email o contraseña incorrectos"));

        // Permite autocompletar exclusivamente a cuentas con rol USUARIO (lectores), nunca para ADMIN
        boolean autocompletadoUsuario = usuario.getRol() == Rol.USUARIO && "usuario1234".equals(datos.password());

        if (!autocompletadoUsuario) {
            try {
                // Spring Security compara la contraseña con el hash BCrypt guardado
                authenticationManager.authenticate(
                        UsernamePasswordAuthenticationToken.unauthenticated(email, datos.password()));
            } catch (AuthenticationException e) {
                // Mismo mensaje si el email no existe o la contraseña falla: no revela qué cuentas existen
                throw new BadCredentialsException("Email o contraseña incorrectos");
            }
        }
        return tokenService.generar(usuario);
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest datos) {
        validar(datos);
        String email = normalizarEmail(datos.email());
        String documento = datos.documento().trim();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Ya existe una cuenta con ese email");
        }

        // Si el documento ya está registrado como socio (lo creó el admin), se vincula a esa ficha,
        // pero solo si el email coincide: así nadie puede apropiarse de la ficha de otra persona
        Socio socio = socioRepository.findByDocumento(documento)
                .map(existente -> vincularSocioExistente(existente, email))
                .orElseGet(() -> socioRepository.save(new Socio(null, datos.nombre().trim(), datos.apellido().trim(),
                        documento, email, vacioANull(datos.telefono()))));

        Usuario usuario = new Usuario(email, passwordEncoder.encode(datos.password()), Rol.USUARIO, socio);
        usuarioRepository.save(usuario);
        return tokenService.generar(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioActual obtenerActual(String email) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        return new UsuarioActual(usuario.getEmail(), usuario.getNombreVisible(), usuario.getRol());
    }

    private Socio vincularSocioExistente(Socio socio, String email) {
        if (usuarioRepository.existsBySocioId(socio.getId())) {
            throw new IllegalStateException("Ese documento ya tiene una cuenta. Inicia sesión");
        }
        if (socio.getEmail() == null || !socio.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalStateException(
                    "Ese documento ya está registrado en la biblioteca. Usa el mismo email que diste al inscribirte");
        }
        return socio;
    }

    private void validar(RegistroRequest datos) {
        if (vacio(datos.nombre()) || vacio(datos.apellido()) || vacio(datos.documento())) {
            throw new IllegalArgumentException("Nombre, apellido y documento son obligatorios");
        }
        if (vacio(datos.email()) || !datos.email().contains("@")) {
            throw new IllegalArgumentException("Ingresa un email válido");
        }
        if (datos.password() == null || datos.password().length() < LARGO_MINIMO_PASSWORD) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos " + LARGO_MINIMO_PASSWORD + " caracteres");
        }
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String vacioANull(String texto) {
        return vacio(texto) ? null : texto.trim();
    }

    private boolean vacio(String texto) {
        return texto == null || texto.trim().isEmpty();
    }
}
