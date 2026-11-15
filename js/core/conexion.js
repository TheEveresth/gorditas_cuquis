// ============================================================
// CONEXION
// ============================================================
// Unico archivo del proyecto que contiene datos de conexion. Ninguna pantalla
// escribe una URL ni una llave: todas usan el cliente `db` que se arma aqui.
// Si cambia el proyecto de Supabase, se cambia aqui y en ningun otro lado.
//
// QUE ES PUBLICO Y QUE NO
// Esto es un sitio estatico: el navegador descarga este archivo tal cual, y
// cualquiera puede leerlo con el inspector. Mover la llave a otro archivo no
// la esconde. La llave `publishable` esta hecha justo para eso: entra como rol
// `anon` y solo puede hacer lo que las politicas RLS y los GRANT de la base le
// permitan. La seguridad real vive en la base, no en este archivo.
//
// NUNCA va aqui (ni en ningun archivo que cargue el navegador):
//   - la llave `service_role` ni la contrasena de Postgres
//   - tokens de terceros (impresora, pagos, WhatsApp)
//   - cualquier cosa que un cliente no deba poder usar
// Eso necesita codigo del lado del servidor: una Edge Function de Supabase que
// guarde el secreto y se consuma como RPC. Mientras no exista, no se agrega el
// secreto "temporalmente" aqui.

const CONEXION = {
  proyecto: "fkzargiqommrbagqnemm",
  url: "https://fkzargiqommrbagqnemm.supabase.co",
  llavePublica: "sb_publishable_uDXPK-ZsE92RyXRy5gs4-A_21gwhK8Q"
};

if (!window.supabase) {
  alert("No se pudo cargar la libreria de Supabase. Revisa tu conexion a internet.");
}

// Un solo cliente por pestana, aunque varios scripts carguen este archivo.
if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(
    CONEXION.url,
    CONEXION.llavePublica
  );
}

const db = window.supabaseClient;
