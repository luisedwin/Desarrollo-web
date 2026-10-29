package com.ejemplo.biblioteca.security;

import com.ejemplo.biblioteca.dto.AuthResponse;
import com.ejemplo.biblioteca.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

// Genera el token JWT firmado que el frontend envía en cada petición
@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final long horasValidez;

    public TokenService(JwtEncoder jwtEncoder, @Value("${app.jwt.horas-validez:8}") long horasValidez) {
        this.jwtEncoder = jwtEncoder;
        this.horasValidez = horasValidez;
    }

    public AuthResponse generar(Usuario usuario) {
        Instant ahora = Instant.now();
        Instant expira = ahora.plus(horasValidez, ChronoUnit.HOURS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("biblioteca-backend")
                .issuedAt(ahora)
                .expiresAt(expira)
                .subject(usuario.getEmail())
                .claim("roles", List.of(usuario.getRol().name()))
                .claim("nombre", usuario.getNombreVisible())
                .build();
        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
        return new AuthResponse(token, expira, usuario.getEmail(), usuario.getNombreVisible(), usuario.getRol());
    }
}
