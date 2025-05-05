export const PAQUETES: { id: number, nombre: string }[] = [
    { id: 1, nombre: '12 MESES' },
    { id: 2, nombre: '9 MESES' },
    { id: 3, nombre: '6 MESES' },
    { id: 4, nombre: '3 MESES' },
    { id: 5, nombre: '1 MES' },
    { id: 6, nombre: '11 MESES' },
    { id: 7, nombre: '10 MESES' },
    { id: 8, nombre: '8 MESES' },
    { id: 9, nombre: '7 MESES' },
    { id: 10, nombre: '5 MESES' },
    { id: 11, nombre: '4 MESES' },
    { id: 12, nombre: '2 MESES' },
    { id: 13, nombre: '8 DÍAS' },
    { id: 14, nombre: '15 DÍAS' }
].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));