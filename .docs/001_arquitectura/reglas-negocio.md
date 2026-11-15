# Reglas de negocio

Cómo cobra Gorditas Cuquis. Cada regla dice si **ya está en el sistema** o si todavía vive en el
Excel. Una regla nueva que el usuario diga en el chat se agrega aquí, no se deja solo en el
código.

## Lo que ya está en el sistema

### Paquetes
Una cuenta (`ordenes`) se divide en **paquetes** (`orden_paquetes`), y cada renglón
(`orden_items`) pertenece a uno. Un paquete es lo que va junto: lo de una persona en la mesa, o
una entrega del pedido para llevar. Sirve para dos cosas: que la cocina sepa qué va junto y que
se pueda cobrar por separado.

### Cobro parcial
Se cobran **renglones, no cuentas**. Cada renglón tiene su bandera `pagado`; la cuenta se cierra
sola cuando ya no queda ninguno pendiente. Por eso el cobro es una transacción en la base
(`cobrar_items`) y no dos llamadas desde el navegador.

### Lo que se cobra
El monto de un cobro es la suma de `cantidad * precio_unitario` de los renglones seleccionados
que **no** estaban pagados, calculada por la base. Lo recibido en efectivo y el cambio se
muestran en pantalla y **no se guardan** en ningún lado.

### Local y para llevar
`tipo = 'local'` lleva mesa; `tipo = 'para_llevar'` no (`mesa_id` nulo) y puede traer nombre y
teléfono del cliente y una `fecha_programada`.

### Producto rápido
Algo que no está en el catálogo se cobra como renglón con `nombre_personalizado` y precio
escrito a mano, sin `producto_id`. Es la válvula de escape mientras el catálogo esté incompleto.

### Precio de empleado
`productos.precio_empleado` existe y es menor que `precio_venta`, pero **ninguna pantalla lo
usa todavía**: el consumo del personal (`consumos_empleado`) no está implementado.

## Lo que sigue en el Excel y **no** está modelado

Vienen de las hojas `CATALOGO`, `GUISOS`, `MODIFICADORES` y `EXCEPCIONES` de
`SistemaCuquis_Fase1.xlsm`. Hoy `productos` solo tiene un `precio_venta` plano, así que nada de
esto se puede representar sin cambiar el esquema (ver `.docs/003_deuda/002_ReglasPrecioGordita.md`).

| Regla | Detalle |
|---|---|
| Precio base de la gordita | $14 con tortilla de **maíz** |
| Tortilla de harina | **+$1** sobre la base |
| Comisión estándar del guiso | **+$2** |
| Comisiones acumulables | si el guiso lleva varias (p. ej. queso y requesón), **se suman**; no se toma la mayor |
| Excepciones | hay guisos que **no** cobran comisión; es una tabla, no una regla general |
| Descuento al personal | **−$2** sobre el precio resultante |

El catálogo real son ≈45 productos y 16 guisos. En la base hay 3 productos y 4 categorías.

## Cosas que el sistema todavía no sabe hacer

- **Corte de caja**: no existe. Y no se puede cuadrar el efectivo, porque lo recibido no se
  guarda (`.docs/003_deuda/008_EfectivoRecibidoNoSeGuarda.md`).
- **Gastos**: las tablas existen, vacías y sin políticas.
- **Nómina**: `empleados.sueldo_semanal` está, y las siete tablas de nómina también, vacías.
  Las reglas (incentivos, multas, préstamos) no están escritas en ningún lado más que en el
  Excel y en la cabeza del dueño: hay que levantarlas antes de programar.
- **Inventario y recetas**: igual, tablas sin estrenar.
- **Ticket y comanda**: hay una impresora de 58 mm (`PV-IMP-58MM-SC`) con sus drivers y tres
  scripts de prueba en la carpeta vieja, y el Excel trae los formatos de `TICKET` y `COMANDA`.
  El POS web no imprime nada.
