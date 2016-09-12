/**
 * Created by mayorovigor on 07.09.16.
 */

var camera,
    controls,
    scene,
    renderer,
    raycaster,
    mouse,
    draw,
    colors = ['#fff', '#000'], // Зададим параметры
    borderWidth = 2,
    axisPadding = 7,
    windowWidth = $('#drawing').width(),
    direction = 0;

var objects = { // Массив, в котором будет хранится вся инфа о имеющихся элементах на странице. Есть идея все это сеарилизировать на сервере
    d2: [],
    d3: [],
    values: [],
    totalWidth: 0,
    segments: 256,
    limit: {
        left: {
            /*radius: false,
            width: false*/
        },
        right: {
            /*radius: false,
            width: false*/
        },
    },
    direction: 0,
    addCube: function (values) {
        this.moveObjects(values.width, this.direction); // Двигаем элементы в сторону

        // 2D
        var group = draw.group();
        group.add(draw.rect(values.width, values.height).colorIt());
        group.placeIt(this.totalWidth, this.direction);

        // 3D
        var object = new THREE.Mesh(new THREE.BoxGeometry(values.height, values.width, values.depth), new THREE.MeshPhongMaterial({
            color: 0xF0F0F0,
            shading: THREE.FlatShading
        }));
        object.translateX(this.totalWidth / 2 * this.direction);
        object.rotation.z = -(90 * Math.PI / 180);
        scene.add(object);
        this.addToArray(group, object, values);
        this.addLimit('radius', values.width);
        return this;
    },

    addSphere: function (values) {
        values.height = values.radius * 2;
        values.width = values.radius * 2;
        this.moveObjects(values.width, this.direction); // Двигаем элементы в сторону

        // 2D
        var group = draw.group();
        group.add(draw.circle(values.radius * 2).colorIt());

        //Axis rendering
        group.add(draw.line(values.width / 2, -axisPadding, values.width / 2, values.width + axisPadding).dashIt(values.width));
        group.add(draw.line(-axisPadding, values.width / 2, values.width + axisPadding, values.width / 2).dashIt(values.width));
        group.placeIt(this.totalWidth, this.direction, true, true);

        // 3D
        var object = new THREE.Mesh(new THREE.SphereGeometry(values.radius, this.segments, this.segments), new THREE.MeshPhongMaterial({
            color: 0xF0F0F0,
            shading: THREE.FlatShading
        }));
        object.translateX(this.totalWidth / 2 * this.direction);
        object.rotation.z = -(90 * Math.PI / 180);
        scene.add(object);

        this.addToArray(group, object, values);
    },

    addCylinder: function (values) {
        values.radius2 = values.radius1;
        values.height = values.radius2 * 2;
        this.moveObjects(values.width, this.direction); // Двигаем элементы в сторону

        // 2D
        var group = draw.group();
        group.add(draw.rect(values.width, values.height).colorIt());

        //Axis rendering
        group.add(draw.line(-axisPadding, values.height / 2, values.width + axisPadding, values.height / 2).dashIt(values.width));
        group.placeIt(this.totalWidth, this.direction, true);

        // 3D
        var object = new THREE.Mesh(new THREE.CylinderGeometry(values.radius1, values.radius2, values.width, this.segments), new THREE.MeshPhongMaterial({
            color: 0xF0F0F0,
            shading: THREE.FlatShading
        }));
        object.translateX(this.totalWidth / 2 * this.direction);
        object.rotation.z = -(90 * Math.PI / 180);
        scene.add(object);
        this.addToArray(group, object, values);

        this.addLimit('width', values.radius2 * 2);
    },

    addCone: function (values) {
        this.moveObjects(values.width, this.direction); // Двигаем элементы в сторону

        // 2D
        var group = draw.group();
        group.add(draw.polygon(createPolyline(values)).colorIt());

        // Axis rendering
        group.add(draw.line(-axisPadding, values.radius1 > values.radius2 ? values.radius1 : values.radius2, values.width + axisPadding, values.radius1 > values.radius2 ? values.radius1 : values.radius2).dashIt(values.width));
        group.placeIt(this.totalWidth, this.direction, true);

        // 3D
        var object = new THREE.Mesh(new THREE.CylinderGeometry(values.radius2, values.radius1, values.width, this.segments), new THREE.MeshPhongMaterial({
            color: 0xF0F0F0,
            shading: THREE.FlatShading
        }));
        object.translateX(this.totalWidth / 2 * this.direction);
        object.rotation.z = -(90 * Math.PI / 180); scene.add(object);

        this.addToArray(group, object, values)
    },

    addToArray: function (d2, d3, values) {
        if (this.direction >= 0) {
            this.d2.push(d2);
            this.d3.push(d3);
            this.values.push(values);
        } else {
            this.d2.unshift(d2);
            this.d3.unshift(d3);
            this.values.unshift(values);
        }
        this.updateTotalWidth(values.width);
        render();
    },
    updateTotalWidth: function (inc) {
        this.totalWidth += inc;
    },
    moveObjects: function (width, direction) {
        $.each(this.d2, function (i, e) {
            e.dx((parseInt(width)) / 2 * -1 * direction)
        });
        $.each(this.d3, function (i, e) {
            e.translateY(parseInt(width) / 2 * -1 * direction)
        });
    },
    delete: function (selected) {
        selected.d2.remove();
        scene.remove(selected.d3);
        this.updateTotalWidth(-selected.values.width);
        this.d2.splice(selected.n, 1);
        this.d3.splice(selected.n, 1);
        this.values.splice(selected.n, 1);
        $.each(this.d2, function (i, e) {
            e.dx(parseInt(selected.values.width) / 2 * (i < selected.n ? 1 : -1));
        });
        $.each(this.d3, function (i, e) {
            e.translateY(parseInt(selected.values.width) / 2 * (i < selected.n ? 1 : -1));
        });
    },
    addLimit: function (type, limit) {
        //this.limit = new Object();
        var d = [];
        d[1] = 'right';
        d[-1] = 'left';
        this.limit[d[this.direction]] = new Object();
        this.limit[d[this.direction]][type] = limit;
        if(this.d2.length == 1){
            this.limit[d[-this.direction]][type] = limit;
        }
        console.log(this.limit);
    }
}

var objectPicker = {
    selected: false,
    selectedObjN: null,
    find: function (object) {
        if(object instanceof THREE.Mesh) {
            var N;
            $.each(objects.d3, function (i, e) {
                if(e == object){
                    N = i; return false;
                }
            });
        } else {
            $.each(objects.d2, function (i, e) {
                if(e.node == object) {
                    N = i; return false;
                }
            });
        }
        this.selectedObjN = N;
        return this;
    },
    select: function () {
        if (!this.selected || this.selectedObjN != this.selected.n){
            if(this.selected && this.selectedObjN != this.selected.n){
                var N = this.selectedObjN;
                this.unselect();
                this.selectedObjN = N;
            }
            toggleSubmenu('show');
            this.selected = {
                d2: objects.d2[this.selectedObjN],
                d3: objects.d3[this.selectedObjN],
                values: objects.values[this.selectedObjN],
                n: this.selectedObjN
            };
            this.selected.d2.first().stroke({ color: '#3c9eff'});
            this.selected.d3.material.color.setHex(0x3c9eff);
        }
        return this;
    },
    unselect: function () {
        toggleSubmenu('hide');
        this.selected.d3.material.color.setHex(0xF0F0F0);
        this.selected.d2.first().stroke({ color: colors[1]});
        this.selected = false;
        this.selectedObjN = false;
        return this;
    }
}

SVG.extend(SVG.Element, {
    colorIt: function () {
        return this.fill(colors[0]).stroke({ width: borderWidth, color: colors[1] });
    },
    dashIt: function (width) {
        return this.stroke({
            width: borderWidth / 2,
            color: '#e67e22',
            dasharray: getDashLength(width - borderWidth / 2) + ', 2, 2, 2'
        });
    },
    placeIt: function (total_width, direction, withAxisX, withAxisY) {
        withAxisX == null ? withAxisX = false : true;
        withAxisY == null ? withAxisY = false : true;
        this.cx(windowWidth / 2 + withAxisX * axisPadding).cy(windowWidth / 2 + withAxisY * axisPadding);
        this.dx(total_width * direction / 2);
        withAxisX || withAxisY ? this.front() : this.back();
        return this;
    }
});

// Инициализация 3D сцены технологией THREE.js
// Выглядит оч круто

function init3D() {
    // Camera, задаем параметры камеры сцены
    camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.set(10, 0, 500);

    scene = new THREE.Scene();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Control, сообщаем программе как будем крутить сцену, кстати, пришлось заюзать сторонюю библиотек, вырванную из примеров THREE.js
    controls = new THREE.TrackballControls(camera, document.getElementById('modeling'));
    controls.panSpeed = 0.8;
    controls.addEventListener('change', render);

    // Lights, освещение сцены, их 3, но на самом деле 2, один на всякий случай, пусть будет
    var lights = [];
    lights[0] = new THREE.DirectionalLight(0xffffff, 0.99);
    lights[1] = new THREE.DirectionalLight(0xffffff, 0.99);
    lights[0].position.set(300, 200, 150);
    lights[1].position.set(-300, -200, -150);
    scene.add(lights[0]);
    scene.add(lights[1]);

    // renderer, рендерер для браузера, сообщаем какой технологией рендерить сцену, в нашем случае - WebGL, будет работать даже на мобилках
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize($('#modeling').width(), $('#modeling').width());
    $('#modeling').append(renderer.domElement);
    $(window).on('resize', function () {
        onWindowResize();
    });
    render();
}

// Функция из документации, шоб ресайзило сцену при ресайзе окна, но почему то все равно не работает
function onWindowResize() {
    console.log('resize');
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    renderer.setSize($('#modeling').width(), $('#modeling').width());
    controls.handleResize();
    render();
}

// Какая то хрень данная в документации, надо использовать шоб работало
function animate() {
    requestAnimationFrame(animate);
    controls.update();
}

// Обновляем 3D сцену
function render() {
    renderer.render(scene, camera);
}

// Инициализируем 2D SVG поле
function init2D() {
    draw = SVG('drawing').size($('#drawing').width(), $('#drawing').width());
}

// Находим использованное модальное окно на основе closest
function getClosestModal(e) {
    return $(e).closest('.modal');
}

// Получаем значения из модального окна в объекте
function getValuesFromModal(e) {
    var obj = new Object();
    e.find('input').each(function () {
        obj[$(this).attr('name')] = parseInt($(this).val());
        //$(this).val('');
    });
    return obj;
}

function getDashLength(width) { //  Подбор длины штриха осевой под коффициент 6 - типо крутая САПР, как компасс
    var i = 1;
    var length = false;
    while (length > 16 || !length) {
        i++;
        length = ((width + 4 + axisPadding * 2) / i - 4);
    }
    return length;
}

function createPolyline(v) {
    return v.radius1 > v.radius2 ? [
        [0, 0],
        [v.width, v.radius1 - v.radius2],
        [v.width, v.radius1 + v.radius2],
        [0, v.radius1 * 2]
    ] : [
        [0, v.radius2 - v.radius1],
        [v.width, 0],
        [v.width, v.radius2 * 2],
        [0, v.radius2 + v.radius1]
    ];
}

function toggleSubmenu(type){
    if(type == 'show') {
        $('.subMenu').fadeIn(100);
    }
    if (type == 'hide') {
        $('.subMenu').fadeOut(100);
    }
}

function doAction(action, values, direction) {
    switch (action) { // Тут понятно, выбираем действие/фигуру
        case 'cubeModal':
            objects.addCube(values, direction);
            break;
        case 'cylinderModal':
            objects.addCylinder(values, direction);
            break;
        case 'coneModal':
            objects.addCone(values, direction);
            break;
        case 'sphereModal':
            objects.addSphere(values, direction);
            break;
        case 'delete':
            objects.delete(objectPicker.selected); objectPicker.unselect();
            break;
        default:
            false;
    }
    render();
}

init2D();
init3D();
animate();

$('.arrows button').click(function () { // вешаем событие на клик по стрелочке
    var clickedDirection = objects.direction;


    objects.direction = $(this).attr('direction') == 'right' ? 1 : -1; // Вычисляем направление

    console.log('clickedDirection = ' + clickedDirection);
    console.log('objects.direction = ' +objects.direction);



    //if(clickedDirection == 0) clickedDirection = objects.direction
    if(objects.direction != clickedDirection){
        $('.arrows > *').removeClass('active');
        $(this).addClass('active');
        $('.shapes > *').removeClass('disabled');

        $('.btn.accept').click(function () {

            var modal = getClosestModal(this).modal('hide'), // Закрываем модальное окно
                action = modal.attr('id'), // Получаем че это вообще за модальное окно было
                values = getValuesFromModal(modal); // Получаем данные из модального окна
            doAction(action, values, objects.direction);
            console.log('new item!');
            if (objects.d2.length == 1) {
                $('.arrows > *').removeClass('disabled');
            }
            $('.arrows > *').removeClass('active');
            $('.shapes > *').addClass('disabled');
            objects.direction = 0;
            clickedDirection = 0;
            $('.btn.accept').unbind();
        });

        $('.btn.close').click(function () {
            $('.btn.accept').unbind();
        })
    } else {
        if (objects.d2.length >= 1) {
            $(this).removeClass('active');
            $('.shapes > *').addClass('disabled');
            $('.btn.accept').unbind();
        }
        objects.direction = 0;
        clickedDirection = 0;
    }

});

if (objects.d2.length < 1) { // если создаем первый элемент,
    $('.arrows button:last-child').click(); // то кликаем на первую попавшуюся стрелочку программой,
    $('.arrows > *').addClass('disabled');
} // нахрена ее тыкать человеку

// Это блок, стреляющий из камеры лучом по фигуре
$('canvas').click(function (event) {

    event.preventDefault();

    var offset = $('canvas').parent().offset();
    mouse.x = ((event.clientX - offset.left) / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - offset.top) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objects.d3);
    if (intersects.length > 0){
        objectPicker.find(intersects[0].object).select();
    } else {
        if(objectPicker.selected) objectPicker.unselect();
    }
    render();
});

$(document).on('click', 'svg > g', function () {
    objectPicker.find(this).select();
    render();
});
$(document).on('click', '#drawing', function (e) {
    if (e.target == this){
        objectPicker.unselect();
        render();
    }
});

$('button').on("click", function (event) {
    if ($(this).hasClass("disabled")) {
        event.stopPropagation()
    }
});