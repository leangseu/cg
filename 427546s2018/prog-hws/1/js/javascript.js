// select elements
var canvas = document.getElementById('canvas');
var clear = document.getElementById('clear');
var undo = document.getElementById('undo');
var done = document.getElementById('done');
var color = document.getElementById('color');
var pixel = document.getElementById('pixel');
var selected = document.getElementById('selected');
var hint = document.getElementById('hint');

// get rendering 2d context for drawing
var ctx = canvas.getContext('2d');
ctx.fillStyle = color.value;

// click event
var clickEvent = new Event('click');
var pixelSize = pixel.value;

// canvas states
var states = [canvas.toDataURL()];

// select all label
var labels = [...document.querySelectorAll('label')];
labels.map(item => {
  item.addEventListener('click', function () {
    var {
      left,
      top,
      width,
      height,
      x,
      y
    } = item.getClientRects()[0];
    selected.style.width = width + 'px';
    selected.style.height = height + 'px';
    selected.style.left = left + 'px';
    selected.style.top = top + 'px';
  })

})

// select all radio input and add event listener
var radioInput = [...document.querySelectorAll('input[type=radio]')];
radioInput.map(item => {
  item.addEventListener('change', async function () {
    if (tool.value == 'polylines' || tool.value == 'polygons') {
      // set done button visibility
      done.style.visibility = "visible";
      // show hint
      hint.style.visibility = "visible";
      plots = [];
    }
    done.dispatchEvent(clickEvent);
    tool = this;
    if (tool.value == 'polylines' || tool.value == 'polygons') {
      // set done button visibility
      done.style.visibility = "visible";
      hint.style.visibility = "visible";
    } else {
      done.style.visibility = "hidden";
      hint.style.visibility = "hidden";
    }
  })
})

// get selected radio
var tool = radioInput.find(e => e.checked);

// draw 1 px at x y location
function drawPixel(x, y) {
  ctx.fillRect(x, y, pixelSize, pixelSize);
}

// redraw canvas
function redrawCanvas(state) {
  const {
    width,
    height
  } = canvas.getClientRects()[0];
  var img = document.createElement('img');
  img.setAttribute('src', state);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
}

async function asyncRedrawCanvas(state) {
  const {
    width,
    height
  } = canvas.getClientRects()[0];
  var img = document.createElement('img');
  await img.setAttribute('src', state);
  await ctx.clearRect(0, 0, width, height);
  await ctx.drawImage(img, 0, 0, width, height);
}

var plots = [];
// canvas on click
canvas.onclick = function (event) {
  const {
    left,
    top,
    width,
    height
  } = canvas.getClientRects()[0];

  var originX;
  var originY;
  var newX;
  var newY;
  var length;

  canvas.addEventListener('mousedown', function (event) {
    originX = event.clientX - left;
    originY = event.clientY - top;
    plots.push({
      x: originX,
      y: originY
    });
    canvas.onmousemove = function (event) {
      newX = event.clientX - left;
      newY = event.clientY - top;
      length = Math.sqrt(Math.pow(newX - originX, 2) + Math.pow(newY - originY, 2));
      redrawCanvas(states[states.length - 1]);
      switch (tool.value) {
        case 'circle':
          drawCircle(originX, originY, length);
          if (plots.length >= 2) {
            done.dispatchEvent(clickEvent);
          }
          break;
        case 'line':
          drawLine(originX, originY, newX, newY);
          if (plots.length >= 2) {
            done.dispatchEvent(clickEvent);
          }
          break;
        case 'ellipse':
          drawEllipse(originX, originY, newX - originX, Math.abs(newY - originY));
          if (plots.length >= 2) {
            done.dispatchEvent(clickEvent);
          }
          break;
        case 'rectangle':
          drawRectangle(originX, originY, newX, newY);
          if (plots.length >= 2) {
            done.dispatchEvent(clickEvent);
          }
          break;
        case 'polygons':
          drawPolylines();
          var originPlot = plots[0];
          if (plots.length > 0) {
            var lastPlot = plots[plots.length - 1];
            drawLine(lastPlot.x, lastPlot.y, newX, newY);
            drawLine(originPlot.x, originPlot.y, newX, newY);
          }
          break;
        case 'polylines':
          drawPolylines();
          if (plots.length > 0) {
            var lastPlot = plots[plots.length - 1];
            drawLine(lastPlot.x, lastPlot.y, newX, newY);
          }
          break;
        default:
          console.log("UNKNOWN");
          break;
      }
    }
  }, {
    once: true
  });
}

// draw circle using midpoint
function drawCircle(originX, originY, radius) {
  var newX = radius;
  var newY = 0;
  var radiusErr = 1 - newX;

  while (newX >= newY) {
    drawPixel(newX + originX, newY + originY);
    drawPixel(newY + originX, newX + originY);
    drawPixel(-newX + originX, newY + originY);
    drawPixel(-newY + originX, newX + originY);
    drawPixel(-newX + originX, -newY + originY);
    drawPixel(-newY + originX, -newX + originY);
    drawPixel(newX + originX, -newY + originY);
    drawPixel(newY + originX, -newX + originY);
    newY++;

    if (radiusErr < 0) {
      radiusErr += 2 * newY + 1;
    } else {
      newX--;
      radiusErr += 2 * (newY - newX + 1);
    }
  }
};

// draw line using midpoint
function drawLine(originX, originY, newX, newY) {
  var distantX = Math.abs(newX - originX);
  var distantY = Math.abs(newY - originY);
  var directionX = (originX < newX) ? 1 : -1;
  var directionY = (originY < newY) ? 1 : -1;
  var err = distantX - distantY;

  while (true) {
    drawPixel(originX, originY);

    if ((originX == newX) && (originY == newY)) break;

    var err2 = 2 * err;
    if (err2 > -distantY) {
      err -= distantY;
      originX += directionX;
    }
    if (err2 < distantX) {
      err += distantX;
      originY += directionY;
    }
  }
};

// draw ellipse
function drawEllipse(centeradiusX, centeradiusY, radiusX, radiusY) {
  var x = 0;
  var y = radiusY;
  var radiusErr = (radiusY * radiusY) - (radiusX * radiusX * radiusY) + ((radiusX * radiusX) / 4);
  while ((2 * x * radiusY * radiusY) < (2 * y * radiusX * radiusX)) {
    drawPixel(centeradiusX + x, centeradiusY - y);
    drawPixel(centeradiusX - x, centeradiusY + y);
    drawPixel(centeradiusX + x, centeradiusY + y);
    drawPixel(centeradiusX - x, centeradiusY - y);

    if (radiusErr < 0) {
      x = x + 1;
      radiusErr = radiusErr + (2 * radiusY * radiusY * x) + (radiusY * radiusY);
    } else {
      x = x + 1;
      y = y - 1;
      radiusErr = radiusErr + (2 * radiusY * radiusY * x + radiusY * radiusY) - (2 * radiusX * radiusX * y);
    }
  }
  radiusErr = (x + 0.5) * (x + 0.5) * radiusY * radiusY + (y - 1) * (y - 1) * radiusX * radiusX - radiusX * radiusX * radiusY * radiusY;

  while (y >= 0) {
    drawPixel(centeradiusX + x, centeradiusY - y);
    drawPixel(centeradiusX - x, centeradiusY + y);
    drawPixel(centeradiusX + x, centeradiusY + y);
    drawPixel(centeradiusX - x, centeradiusY - y);

    if (radiusErr > 0) {
      y = y - 1;
      radiusErr = radiusErr - (2 * radiusX * radiusX * y) + (radiusX * radiusX);

    } else {
      y = y - 1;
      x = x + 1;
      radiusErr = radiusErr + (2 * radiusY * radiusY * x) - (2 * radiusX * radiusX * y) - (radiusX * radiusX);
    }
  }
}

// draw rectangle
function drawRectangle(originalX, originalY, newX, newY) {
  drawLine(originalX, originalY, newX, originalY);
  drawLine(originalX, newY, newX, newY);
  drawLine(originalX, newY, originalX, originalY);
  drawLine(newX, newY, newX, originalY);
}

// draw ploylines
function drawPolylines() {
  for (var i = 0; i < plots.length - 1; i++) {
    drawLine(plots[i].x, plots[i].y, plots[i + 1].x, plots[i + 1].y);
  }
}

function drawPolygons() {
  drawPolylines();
  var originPlot = plots[0];
  var lastPlot = plots[plots.length - 1];
  drawLine(lastPlot.x, lastPlot.y, originPlot.x, originPlot.y);
}
// clear canvas
clear.addEventListener('click', function (e) {
  const {
    width,
    height
  } = canvas.getClientRects()[0];
  ctx.clearRect(0, 0, width, height);
  states.push(canvas.toDataURL());
  e.preventDefault();
})

// undo
undo.addEventListener('click', function (e) {
  if (states.length > 1) {
    states.pop()
    asyncRedrawCanvas(states[states.length - 1]);
  }
  e.preventDefault();
})

// done
done.addEventListener('click', async function (event) {
  await asyncRedrawCanvas(states[states.length - 1]);
  if (plots.length >= 2) {
    switch (tool.value) {
      case "circle":
        var radius = Math.sqrt(Math.pow(plots[1].x - plots[0].x, 2) + Math.pow(plots[1].y - plots[0].y, 2));
        drawCircle(plots[0].x, plots[0].y, radius);
        break;
      case "line":
        drawLine(plots[0].x, plots[0].y, plots[1].x, plots[1].y);
        break;
      case "ellipse":
        drawEllipse(plots[0].x, plots[0].y, plots[1].x - plots[0].x, Math.abs(plots[1].y - plots[0].y));
        break;
      case "rectangle":
        drawRectangle(plots[0].x, plots[0].y, plots[1].x, plots[1].y);
        break;
      case "polylines":
        drawPolylines();
        break;
      case "polygons":
        drawPolygons();
        break;
      default:
        console.log("UNKNOW");
        break;
    }
    states.push(canvas.toDataURL());
  }
  await asyncRedrawCanvas(states[states.length - 1]);
  canvas.onmousemove = null;
  plots = [];
  event.preventDefault();
});

color.addEventListener('change', function (event) {
  ctx.fillStyle = this.value;
})

pixel.addEventListener('change', function (event) {
  pixelSize = Math.round(this.value) || 1;
})

canvas.dispatchEvent(clickEvent);
labels[0].dispatchEvent(clickEvent);

window.addEventListener('resize', function() {
  labels[0].dispatchEvent(clickEvent);
})
