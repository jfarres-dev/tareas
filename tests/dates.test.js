// Helpers de fecha de js/logs.js.
// Ejecutar: node --test tests/
//
// Estas pruebas fijan la zona horaria a Europe/Madrid porque el fallo que
// cubren solo aparece cuando la hora local va por delante de UTC.
process.env.TZ = 'Europe/Madrid';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'logs.js'), 'utf8');

// js/logs.js es un script clásico: al evaluarlo, sus funciones quedan como
// globales del contexto. Con nowIso se congela "ahora" para poder probar
// madrugadas y cambios de horario.
function loadLogs(nowIso) {
  const ctx = { console };
  if (nowIso) {
    const fixed = new Date(nowIso).getTime();
    const RealDate = Date;
    const FakeDate = function (...args) {
      return args.length === 0 ? new RealDate(fixed) : new RealDate(...args);
    };
    FakeDate.prototype = RealDate.prototype;
    FakeDate.now = () => fixed;
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    ctx.Date = FakeDate;
  }
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}

test('la zona horaria de prueba es la esperada', () => {
  assert.strictEqual(new Date('2026-07-15T00:00:00Z').getHours(), 2,
    'Europe/Madrid no está activa; el resto de pruebas no sería concluyente');
});

test('toDateString usa la fecha local, no UTC', () => {
  const { toDateString } = loadLogs();
  // 01:30 en Madrid es todavía el día anterior en UTC
  const d = new Date('2026-07-15T01:30:00+02:00');
  assert.strictEqual(toDateString(d), '2026-07-15');
  assert.strictEqual(d.toISOString().slice(0, 10), '2026-07-14'); // el fallo original
});

test('today() de madrugada devuelve el día local', () => {
  const { today } = loadLogs('2026-07-15T01:30:00+02:00');
  assert.strictEqual(today(), '2026-07-15');
});

test('de madrugada, escritura y lectura apuntan al mismo día local', () => {
  // La raíz del fallo: handleCheck escribía con today() (UTC) mientras las
  // rachas y el heatmap leían con fmtKey(daysAgo(n)) (local).
  // Se compara contra el día esperado, no una función contra la otra: ahora
  // comparten implementación y eso haría la prueba tautológica.
  const { today, fmtKey, daysAgo } = loadLogs('2026-07-15T01:30:00+02:00');
  assert.strictEqual(today(), '2026-07-15');
  assert.strictEqual(fmtKey(daysAgo(0)), '2026-07-15');
});

test('fmtKey y toDateString no vuelven a divergir', () => {
  // Guardián: fmtKey delega hoy en toDateString, así que esto solo puede
  // romperse si alguien le devuelve una implementación propia.
  const { fmtKey, toDateString, daysAgo } = loadLogs();
  for (let i = 0; i < 400; i++) {
    const d = daysAgo(i);
    assert.strictEqual(fmtKey(d), toDateString(d), 'divergen en ' + d);
  }
});

test('tomorrow() acierta en el cambio de horario de octubre (día de 25 h)', () => {
  // Sumar 86400000 ms aquí devolvía el mismo día, no el siguiente
  const { tomorrow } = loadLogs('2026-10-25T00:30:00+02:00');
  assert.strictEqual(tomorrow(), '2026-10-26');
});

test('tomorrow() acierta en el cambio de horario de marzo (día de 23 h)', () => {
  const { tomorrow } = loadLogs('2026-03-29T00:30:00+01:00');
  assert.strictEqual(tomorrow(), '2026-03-30');
});

test('tomorrow() cruza bien el fin de mes y el fin de año', () => {
  assert.strictEqual(loadLogs('2026-01-31T10:00:00+01:00').tomorrow(), '2026-02-01');
  assert.strictEqual(loadLogs('2026-12-31T23:00:00+01:00').tomorrow(), '2027-01-01');
  assert.strictEqual(loadLogs('2028-02-28T10:00:00+01:00').tomorrow(), '2028-02-29'); // bisiesto
});

test('daysAgo devuelve medianoche local y retrocede por calendario', () => {
  const { daysAgo, toDateString } = loadLogs('2026-03-30T12:00:00+02:00');
  const d = daysAgo(1);
  assert.strictEqual(d.getHours(), 0);
  assert.strictEqual(toDateString(d), '2026-03-29');
});
