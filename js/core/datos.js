// ============================================================
// CAPA DE DATOS
// ============================================================
// Todas las consultas a la base viven aqui. Una pantalla NO escribe
// `db.from(...)` ni `db.rpc(...)`: llama a `datos.<operacion>()`.
//
// Para que sirve:
//   - los nombres de tablas y columnas estan en un solo archivo, asi que un
//     cambio de esquema se arregla aqui y no en ocho pantallas;
//   - cada pantalla queda con la mitad de codigo, porque el manejo del error
//     ya esta hecho;
//   - se ve de un vistazo todo lo que el navegador puede pedirle a la base.
//
// CONTRATO (igual en todas las funciones):
//   - lecturas y altas  -> devuelven el dato, o `null` si fallo;
//   - cambios y borrados -> devuelven `true` o `false`;
//   - si fallo, esta capa YA le aviso al usuario y lo registro en la consola.
//     La pantalla solo tiene que cortar:  if (!x) return;
//   - el `mensaje` es opcional y sirve para que el aviso diga lo que esa
//     pantalla espera ("Error al abrir cuenta" vs "Error al cargar la orden").
//
// Esto no es seguridad: quien quiera puede llamar a la base por su cuenta con
// la llave publica. Lo que se puede hacer o no lo deciden las politicas RLS,
// los GRANT y las RPC de la base. Ver .claude/skills/supabase-cuquis.

function avisarError(mensaje, error) {
  console.error(mensaje, error);
  alert(mensaje);
}

const datos = {

  // ----------------------------------------------------------
  // SESION
  // ----------------------------------------------------------

  // Devuelve el empleado si la contrasena es correcta, `null` si no coincide,
  // o `undefined` si la base no respondio (en ese caso ya se aviso).
  // La contrasena se verifica con bcrypt DENTRO de la base: la tabla
  // `empleados` no es legible desde el navegador.
  async login(numero, password) {
    const { data, error } = await db.rpc("login_empleado", {
      p_numero: numero,
      p_password: password
    });

    if (error) {
      avisarError("Error al conectar con la base de datos", error);
      return undefined;
    }

    const empleado = Array.isArray(data) ? data[0] : data;
    return empleado || null;
  },

  // ----------------------------------------------------------
  // CATALOGO
  // ----------------------------------------------------------

  async categoriasActivas() {
    const { data, error } = await db
      .from("categorias")
      .select("*")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    if (error) {
      avisarError("Error al cargar categorías", error);
      return null;
    }

    return data;
  },

  async productosActivos() {
    const { data, error } = await db
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      avisarError("Error al cargar productos", error);
      return null;
    }

    return data;
  },

  async mesasActivas() {
    const { data, error } = await db
      .from("mesas")
      .select("*")
      .eq("activa", true)
      .order("numero", { ascending: true });

    if (error) {
      avisarError("Error al cargar mesas", error);
      return null;
    }

    return data;
  },

  // Las mesas con sus ordenes, para pintar el total de cada una.
  async mesasActivasConOrdenes() {
    const { data, error } = await db
      .from("mesas")
      .select(`
        *,
        ordenes (
          id,
          total,
          estado
        )
      `)
      .eq("activa", true)
      .order("numero", { ascending: true });

    if (error) {
      avisarError("Error al cargar mesas", error);
      return null;
    }

    return data;
  },

  async mesaPorId(mesaId, mensaje = "Error al seleccionar mesa") {
    const { data, error } = await db
      .from("mesas")
      .select("*")
      .eq("id", mesaId)
      .single();

    if (error) {
      avisarError(mensaje, error);
      return null;
    }

    return data;
  },

  // ----------------------------------------------------------
  // ORDENES
  // ----------------------------------------------------------

  async ordenPorId(ordenId, mensaje = "Error al cargar la orden") {
    const { data, error } = await db
      .from("ordenes")
      .select("*")
      .eq("id", ordenId)
      .single();

    if (error) {
      avisarError(mensaje, error);
      return null;
    }

    return data;
  },

  // Cuentas abiertas de una mesa, con lo necesario para sumar su total.
  async cuentasAbiertasDeMesa(mesaId) {
    const { data, error } = await db
      .from("ordenes")
      .select(`
        *,
        orden_items (
          cantidad,
          precio_unitario
        )
      `)
      .eq("mesa_id", mesaId)
      .eq("estado", "abierta")
      .order("created_at", { ascending: true });

    if (error) {
      avisarError("Error al cargar cuentas", error);
      return null;
    }

    return data;
  },

  // Cola de la cocina: TODAS las ordenes abiertas, de mesa y para llevar, en
  // orden de llegada. Trae `mesas` para que la tarjeta pueda decir "Mesa 3".
  async ordenesAbiertasDeCocina() {
    const { data, error } = await db
      .from("ordenes")
      .select(`
        *,
        mesas (
          numero,
          nombre
        ),
        orden_items (
          cantidad,
          precio_unitario,
          nombre_personalizado,
          productos (
            nombre
          )
        )
      `)
      .eq("estado", "abierta")
      .order("created_at", { ascending: true });

    if (error) {
      avisarError("Error al cargar la cola de cocina", error);
      return null;
    }

    return data;
  },

  // Para el dashboard: ventas del dia. `desde` es una fecha en ISO.
  async ordenesCerradasDesde(desde) {
    const { data, error } = await db
      .from("ordenes")
      .select("total, created_at")
      .gte("created_at", desde)
      .eq("estado", "cerrada");

    if (error) {
      avisarError("Error al cargar las ventas del día", error);
      return null;
    }

    return data;
  },

  // Ordenes locales abiertas, para contar cuantas mesas estan ocupadas.
  async ordenesLocalesAbiertas() {
    const { data, error } = await db
      .from("ordenes")
      .select("mesa_id")
      .eq("estado", "abierta")
      .eq("tipo", "local")
      .not("mesa_id", "is", null);

    if (error) {
      avisarError("Error al cargar las mesas ocupadas", error);
      return null;
    }

    return data;
  },

  // `campos` son las columnas de `ordenes`; devuelve la orden creada.
  async crearOrden(campos, mensaje = "Error al crear la cuenta") {
    const { data, error } = await db
      .from("ordenes")
      .insert([campos])
      .select()
      .single();

    if (error) {
      avisarError(mensaje, error);
      return null;
    }

    return data;
  },

  async actualizarTotalesOrden(ordenId, subtotal, total) {
    const { error } = await db
      .from("ordenes")
      .update({ subtotal, total })
      .eq("id", ordenId);

    if (error) {
      avisarError("Error al actualizar total de la cuenta", error);
      return false;
    }

    return true;
  },

  async marcarOrdenLista(ordenId) {
    const { error } = await db
      .from("ordenes")
      .update({ estado_preparacion: "listo" })
      .eq("id", ordenId);

    if (error) {
      avisarError("Error al marcar pedido como listo", error);
      return false;
    }

    return true;
  },

  // ----------------------------------------------------------
  // PAQUETES
  // ----------------------------------------------------------

  // Devuelve los paquetes con sus renglones, tal como vienen de la base.
  // Quien los pinta decide como aplanarlos.
  async paquetesDeOrden(ordenId) {
    const { data, error } = await db
      .from("orden_paquetes")
      .select(`
        id,
        nombre,
        created_at,
        orden_items (
          id,
          producto_id,
          nombre_personalizado,
          cantidad,
          precio_unitario,
          pagado,
          productos (
            nombre
          )
        )
      `)
      .eq("orden_id", ordenId)
      .order("created_at", { ascending: true });

    if (error) {
      avisarError("Error al cargar paquetes", error);
      return null;
    }

    return data;
  },

  async crearPaquete(ordenId, nombre, mensaje = "Error al crear paquete") {
    const { data, error } = await db
      .from("orden_paquetes")
      .insert([{ orden_id: ordenId, nombre }])
      .select()
      .single();

    if (error) {
      avisarError(mensaje, error);
      return null;
    }

    return data;
  },

  // ----------------------------------------------------------
  // RENGLONES DE LA ORDEN
  // ----------------------------------------------------------

  async agregarItem(item, mensaje = "Error al agregar producto") {
    const { error } = await db
      .from("orden_items")
      .insert([item]);

    if (error) {
      avisarError(mensaje, error);
      return false;
    }

    return true;
  },

  async agregarItems(items, mensaje = "Error al agregar los productos") {
    const { error } = await db
      .from("orden_items")
      .insert(items);

    if (error) {
      avisarError(mensaje, error);
      return false;
    }

    return true;
  },

  async cambiarCantidadItem(itemId, cantidad, mensaje = "Error al actualizar producto") {
    const { error } = await db
      .from("orden_items")
      .update({ cantidad })
      .eq("id", itemId);

    if (error) {
      avisarError(mensaje, error);
      return false;
    }

    return true;
  },

  async eliminarItem(itemId) {
    const { error } = await db
      .from("orden_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      avisarError("Error al eliminar producto", error);
      return false;
    }

    return true;
  },

  // ----------------------------------------------------------
  // COBRO
  // ----------------------------------------------------------

  // Todo el cobro ocurre en UNA transaccion dentro de la base: registra el
  // pago, marca los renglones y cierra la cuenta si ya no queda nada. El monto
  // lo calcula la base a partir de los renglones; el navegador no manda
  // importes. Devuelve { total_cobrado, items_cobrados, pendientes, cerrada }.
  async cobrarItems(ordenId, itemIds, metodo, empleadoId) {
    const { data, error } = await db.rpc("cobrar_items", {
      p_orden_id: ordenId,
      p_item_ids: itemIds,
      p_metodo: metodo,
      p_empleado_id: empleadoId
    });

    if (error) {
      avisarError(`Error al cobrar: ${error.message}`, error);
      return null;
    }

    return data;
  }

};
