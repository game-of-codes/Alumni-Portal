// $('.form').find('input, textarea').on('keyup blur focus', function (e) {

//     var $this = $(this),
//         label = $this.prev('label');

//         if (e.type === 'keyup') {
//               if ($this.val() === '') {
//             label.removeClass('active highlight');
//           } else {
//             label.addClass('active highlight');
//           }
//       } else if (e.type === 'blur') {
//           if( $this.val() === '' ) {
//               label.removeClass('active highlight');
//               } else {
//               label.removeClass('highlight');
//               }
//       } else if (e.type === 'focus') {

//         if( $this.val() === '' ) {
//               label.removeClass('highlight');
//               }
//         else if( $this.val() !== '' ) {
//               label.addClass('highlight');
//               }
//       }

//   });

//   $('.tab a').on('click', function (e) {

//     e.preventDefault();

//     $(this).parent().addClass('active');
//     $(this).parent().siblings().removeClass('active');

//     target = $(this).attr('href');

//     $('.tab-content > div').not(target).hide();

//     $(target).fadeIn(600);

//   });
/* ---- particles.js config ---- */

particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 125,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 1
            },
            "image": {
                "src": "img/github.svg",
                "width": 100,
                "height": 100
            }
        },
        "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 40,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 6,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "grab"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 140,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 200,
                "duration": 0.4
            },

        }
    },
    "retina_detect": true
});
