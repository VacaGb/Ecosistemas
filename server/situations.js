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
    title: 'El camino al campamento', icon: '🧭',
    story: 'Cae la tarde. El mapa marca una ruta señalizada al campamento y un atajo desconocido entre pastos altos.',
    lesson: 'Planificar el recorrido, conservar recursos y seguir rutas conocidas evita riesgos innecesarios.',
    options: [
      { text: 'Seguir la ruta señalizada y regular el ritmo', water: -10, energy: -10, survival: 15, points: 300 },
      { text: 'Tomar el atajo sin revisar el terreno', water: -20, energy: -20, survival: -20, points: 50 },
      { text: 'Correr sin orientación hasta encontrar algo', water: -25, energy: -25, survival: -15, points: 0 }
    ]
  },
  {
    title: 'Una pausa para recargar', icon: '🏕️',
    story: 'Llegas al campamento intermedio. Hay agua potable y raciones suficientes para todos. Mañana la expedición continúa. ¿Cómo te preparas?',
    lesson: 'Aprovechar los puntos seguros de abastecimiento para hidratarse, alimentarse y rellenar la cantimplora ayuda a prevenir el agotamiento.',
    options: [
      { text: 'Beber agua, comer una ración y rellenar mi cantimplora', water: 20, energy: 10, survival: 10, points: 300 },
      { text: 'Salir enseguida sin beber ni revisar mis reservas', water: -15, energy: -10, survival: -10, points: 50 },
      { text: 'Comer, pero dejar la cantimplora vacía para cargar menos', water: -10, energy: 10, survival: -5, points: 100 }
    ]
  },
  {
    title: 'La sabana también se enfría', icon: '🌙',
    story: 'La temperatura baja al anochecer. En el campamento tienes un refugio preparado, ropa seca y un saco de dormir.',
    lesson: 'La sabana puede enfriarse por la noche. Usar ropa seca, abrigo y un refugio adecuado ayuda a conservar el calor y descansar.',
    options: [
      { text: 'Dormir al aire libre con la ropa húmeda', water: -5, energy: -20, survival: -20, points: 0 },
      { text: 'Pasar la noche caminando para no sentir frío', water: -15, energy: -25, survival: -10, points: 50 },
      { text: 'Ponerme ropa seca y descansar abrigado en el refugio', water: -5, energy: 15, survival: 15, points: 300 }
    ]
  },
  {
    title: 'Un río que cambió', icon: '🌊',
    story: 'A la mañana siguiente, el río ha crecido por la lluvia. El paso habitual está cubierto de agua y el guía conoce una ruta hacia un puente habilitado.',
    lesson: 'La profundidad y la fuerza del agua pueden ser difíciles de estimar. Evitar un paso inundado y usar un cruce habilitado reduce el riesgo.',
    options: [
      { text: 'Cruzar por el agua para no perder tiempo', water: -15, energy: -20, survival: -30, points: 0 },
      { text: 'Seguir al guía por la ruta al puente habilitado', water: -10, energy: -10, survival: 15, points: 300 },
      { text: 'Buscar un paso más estrecho y saltar sin comprobarlo', water: -10, energy: -15, survival: -20, points: 50 }
    ]
  },
  {
    title: 'Visitantes diminutos', icon: '🦟',
    story: 'Durante una parada aparecen muchos mosquitos. Llevas ropa ligera de manga larga y un repelente adecuado para ti.',
    lesson: 'Cubrir la piel y aplicar un repelente siguiendo su etiqueta ayuda a reducir las picaduras. Evitar picaduras es importante en zonas con enfermedades transmitidas por mosquitos.',
    options: [
      { text: 'Cubrirme la piel y usar el repelente según su etiqueta', water: -5, energy: -5, survival: 15, points: 300 },
      { text: 'Ignorar los mosquitos y dejar más piel descubierta', water: -5, energy: -10, survival: -20, points: 0 },
      { text: 'Correr sin parar para intentar dejarlos atrás', water: -20, energy: -20, survival: -5, points: 50 }
    ]
  },
  {
    title: 'Una visita sin dejar huella', icon: '♻️',
    story: 'Termina la parada para comer. Quedan envoltorios y restos de comida, y hay animales cerca. Llevas una bolsa para residuos.',
    lesson: 'Retirar los residuos y no alimentar a la fauna evita contaminación y reduce la posibilidad de que los animales se acerquen a las personas buscando comida.',
    options: [
      { text: 'Dejar los restos para que los animales se los coman', water: -5, energy: 0, survival: -20, points: 0 },
      { text: 'Enterrar los envoltorios junto al lugar de descanso', water: -10, energy: -10, survival: -10, points: 50 },
      { text: 'Guardar los residuos y llevarlos al punto de recogida', water: -5, energy: -5, survival: 10, points: 300 }
    ]
  },
  {
    title: 'La última decisión', icon: '📻',
    story: 'En el último tramo, una señal caída genera dudas sobre el camino. El grupo está en un lugar seguro y dispone de mapa, GPS y radio para contactar con la base.',
    lesson: 'Cuando hay dudas sobre la ruta, detenerse en un lugar seguro, comprobar la ubicación y comunicarse con la base es mejor que avanzar sin orientación o separar al grupo.',
    options: [
      { text: 'Separarnos para buscar el campamento en distintas direcciones', water: -20, energy: -20, survival: -25, points: 0 },
      { text: 'Comprobar la ubicación y confirmar la ruta con la base', water: -10, energy: -10, survival: 15, points: 300 },
      { text: 'Elegir el sendero que parece más corto sin verificarlo', water: -15, energy: -15, survival: -15, points: 50 }
    ]
  }
];
