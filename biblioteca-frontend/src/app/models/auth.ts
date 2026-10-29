export type Rol = 'ADMIN' | 'USUARIO';

// Lo que devuelve el backend al iniciar sesión o registrarse
export interface Sesion {
  token: string;
  expiraEn: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  telefono: string | null;
  password: string;
}
