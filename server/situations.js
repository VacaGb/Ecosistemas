module.exports = [
  {
    title: 'El sol no da tregua', icon: '☀️',
    story: 'Es mediodía y el calor aumenta. Necesitas llegar al siguiente refugio. ¿Cómo administras tus recursos?',
    lesson: 'Descansar a la sombra durante las horas más calurosas reduce la pérdida de agua y energía.',
    options: [
      { text: 'Descansar a la sombra y caminar al atardecer', water: -5, energy: 15, survival: 10, points: 300 },
      { text: 'Correr bajo el sol para llegar antes', water: -25, energy: -20, survival: -10, points: 50 },
      { text: 'Continuar caminando sin descansar', water: -15, energy: -15, survival: -5, points: 100 }
    ]
  },
  {
    title: 'Un agua engañosa', icon: '💧',
    story: 'Encuentras agua estancada. En esta expedición llevas un recipiente y un equipo para potabilizarla. ¿Qué decides?',
    lesson: 'El agua aparentemente limpia puede contener microorganismos. Potabilizarla con un método adecuado reduce el riesgo de enfermedad.',
    options: [
      { text: 'Beber directamente porque parece limpia', water: 15, energy: -10, survival: -25, points: 50 },
      { text: 'Potabilizar el agua antes de beber', water: 25, energy: -5, survival: 15, points: 300 },
      { text: 'Seguir sin reponer agua', water: -20, energy: -10, survival: -5, points: 100 }
    ]
  },
  {
    title: 'Vecinos salvajes', icon: '🦁',
    story: 'Observas leones descansando junto al camino. Todavía estás lejos y no han reaccionado a tu presencia.',
    lesson: 'Respetar la distancia con la fauna y evitar acercarse protege tanto a las personas como a los animales.',
    options: [
      { text: 'Acercarme para tomar una fotografía', water: -5, energy: -10, survival: -30, points: 0 },
      { text: 'Gritar e intentar espantarlos', water: -10, energy: -15, survival: -25, points: 50 },
      { text: 'Mantener distancia y tomar una ruta alternativa', water: -10, energy: -5, survival: 15, points: 300 }
    ]
  },
  {
    title: 'La cena de la expedición', icon: '🌿',
    story: 'Tienes hambre. Ves frutos desconocidos, pero todavía quedan raciones en tu mochila.',
    lesson: 'Nunca se debe asumir que una planta es comestible por su apariencia o porque otro animal la consume.',
    options: [
      { text: 'Comer los frutos de colores llamativos', water: -10, energy: 5, survival: -25, points: 0 },
      { text: 'Administrar las raciones que llevo', water: -5, energy: 20, survival: 10, points: 300 },
      { text: 'No comer nada y seguir caminando', water: -5, energy: -20, survival: -5, points: 100 }
    ]
  },
  {
    title: 'Tormenta en el horizonte', icon: '⛈️',
    story: 'Se aproxima una tormenta. Puedes llegar al refugio cerrado de la expedición antes de que comience.',
    lesson: 'Durante una tormenta eléctrica, un edificio cerrado adecuado es más seguro que un árbol aislado o un cauce que puede inundarse.',
    options: [
      { text: 'Refugiarme bajo el árbol más alto', water: 5, energy: 5, survival: -25, points: 50 },
      { text: 'Esperar en el cauce seco del río', water: 5, energy: -10, survival: -30, points: 0 },
      { text: 'Llegar al refugio cerrado', water: -5, energy: -10, survival: 20, points: 300 }
    ]
  },
  {
    title: 'El último tramo', icon: '🧭',
    story: 'Cae la tarde. El mapa marca una ruta señalizada al campamento y un atajo desconocido entre pastos altos.',
    lesson: 'Planificar el recorrido, conservar recursos y seguir rutas conocidas evita riesgos innecesarios.',
    options: [
      { text: 'Seguir la ruta señalizada y regular el ritmo', water: -10, energy: -10, survival: 15, points: 300 },
      { text: 'Tomar el atajo sin revisar el terreno', water: -20, energy: -20, survival: -20, points: 50 },
      { text: 'Correr sin orientación hasta encontrar algo', water: -25, energy: -25, survival: -15, points: 0 }
    ]
  }
];
