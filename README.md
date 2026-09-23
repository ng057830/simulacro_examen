# 🏛️ Simulador Oficial de Examen de Oposiciones (RVNE - Razonamiento Numérico)

Aplicativo web interactivo (HTML5, CSS3, JavaScript Vainilla) diseñado para simular de forma realista las pruebas oficiales informatizadas de acceso a la función pública en España (Administración General del Estado, Auxiliar / Administrativo C1 y C2, INAP, Correos) y procesos selectivos de la Unión Europea (EPSO).

---

## 🚀 Características Principales

- **⏱️ Temporizador de 20 Minutos**: Cuenta regresiva estricta con avisos visuales (alerta ámbar a los 5 minutos y roja palpitante en el último minuto). Entrega automática al llegar a `00:00`.
- **🧮 Calculadora Básica Oficial en Pantalla**: Funciones permitidas por la normativa oficial (`+`, `-`, `×`, `÷`, `%`, `√`, `±`, memorias `MC`, `MR`, `M+`, `M-`). Admite teclado numérico físico y es arrastrable por la pantalla.
- **📝 Cuaderno de Borrador / Bloc de Notas**: Área de apuntes para operaciones intermedias con **guardado automático** en tiempo real.
- **📚 18 Exámenes Oficiales Reales (180 Preguntas)**: Banco completo extraído de los cuadernos de repaso `RVNE-70` a `RVNE-110` del Instituto Europeo, renderizados en alta definición sin errores de formato.
- **🎲 Modo Aleatorio Combinado**: Genera un examen sorpresa combinando 10 preguntas aleatorias de toda la base de datos.
- **🎯 Baremos de Corrección Seleccionables**:
  - **Oposiciones España**: +1.00 por acierto, -0.25 por error, 0 en blanco.
  - **EPSO Unión Europea**: +1.00 por acierto, sin penalización por error.
- **📖 Módulo de Soluciones Explicadas Paso a Paso**: Explicación matemática detallada y resolución oficial para cada ejercicio.
- **⚡ 100% Autónomo**: No requiere servidores, bases de datos externas ni conexión a internet.

---

## 💻 Cómo Ejecutar el Simulador

### Opción A (Local):
1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/ng057830/simulacro_examen.git
   ```
2. Haz doble clic en `index.html` o en `INICIAR_SIMULADOR.bat`.
3. ¡Listo! Se abrirá automáticamente en cualquier navegador web moderno.

### Opción B (GitHub Pages):
Este repositorio puede ser desplegado directamente en **GitHub Pages** (Settings -> Pages -> Deploy from branch `main` -> `/root`), permitiendo a cualquier candidato realizar las pruebas en línea desde cualquier dispositivo u ordenador.

---

## ⌨️ Atajos de Teclado Durante la Prueba

| Tecla | Acción |
| :--- | :--- |
| **`1` a `5`** o **`A` a `E`** | Seleccionar opción de respuesta |
| **`→` (Flecha derecha)** | Siguiente pregunta |
| **`←` (Flecha izquierda)** | Pregunta anterior |
| **`F`** o **`M`** | Marcar pregunta con bandera (🚩) para revisión |
| **`Delete (Supr)`** | Borrar respuesta (dejar en blanco) |
| **`Alt + C`** | Mostrar / ocultar Calculadora |
| **`Alt + N`** | Mostrar / ocultar Bloc de Notas |

---

## 📁 Estructura del Proyecto

```
simulacro_examen/
├── INICIAR_SIMULADOR.bat      # Lanzador para Windows
├── README.md                  # Documentación del proyecto
├── README_INSTRUCCIONES.md    # Manual para el candidato
├── index.html                 # Página principal del simulador
├── css/
│   ├── styles.css             # Estilos generales e institucionales
│   ├── calculator.css         # Calculadora digital y borrador flotante
│   └── exam.css               # Estilos de preguntas, opciones y resultados
├── js/
│   ├── exam_data.js           # Base de datos completa con los 18 exámenes y soluciones
│   ├── calculator.js          # Lógica de la calculadora básica
│   ├── notepad.js             # Lógica del bloc de notas con persistencia local
│   ├── timer.js               # Lógica del temporizador oficial
│   └── app.js                 # Controlador principal y máquina de estados
└── assets/
    ├── questions/             # Imágenes HD de las 180 preguntas
    └── solutions/             # Hojas oficiales de soluciones explicadas
```

---

*Desarrollado para Gregorio como simulador de preparación para las pruebas de acceso a la función pública en España.*
