class Handedness {
    constructor(options) {
        window.addEventListener('touchstart', (e) => { this.start(e); }, false);
        window.addEventListener('touchend', (e) => { this.end(e); }, false);

        var default_options = {
            threshold: .25,
            minimum_touches: 1,
            auto_clean: false,
            clean_time: 5 * 1000,
        }

        this.options = Object.assign(default_options, options);
        
        this.last_point;
        this.touches = [];
        this.last_touch_trail;
        this.last_classification = { total: 0, count: 0, grade: 1 };
    }

    start(e) {
        if(e.target.getAttribute('data-h-ignore') !== 'true') {
            this.last_point = new Vector2(e);
        }
    }

    end(e) {
        let position = new Vector2(e);
        let touch_trail = {
            start: this.last_point,
            end: position,
            vertical: this.checkIfVertical(this.last_point, position)
        }

        if (touch_trail.vertical === true) {
            this.touches.push(touch_trail);

            if(this.touches.length >= this.options.minimum_touches) {
                this.classify(touch_trail);
            }
        }
    }

    checkIfVertical(s, e) {
        let w = window.innerWidth;
        let h = window.innerHeight;

        let _diff = s.diff(e);
        let t = w * this.options.threshold;

        if (_diff.x >= t) {
            return false;
        }
        else {
            if (_diff.x > _diff.y) {
                return false;
            }
            else {
                return true;
            }
        }
    }

    classify(touch_trail) {
        this.last_classification.total += this.classifyTouch(touch_trail.start.getFurther(touch_trail.end));
        this.last_classification.count += 1;
        this.last_classification.grade = this.last_classification.total / this.last_classification.count;

        let side;
        let last_config = JSON.parse(JSON.stringify(this.last_classification));
        if (this.last_classification.grade <= 0.5) {
            side = 'left';
        }
        else {
            side = 'right';
        }

        this.last_classification.handedness = side;
        this.checkAndNotify(last_config.handedness || 'right', side);
    }

    classifyTouch(point) {
        return point.x / window.innerWidth;
    }

    checkAndNotify(old_h, new_h) {
        console.log(this.options)
        if (old_h !== new_h) {
            if (this.options.listener) {
                try {
                    this.options.listener({ classification: this.last_classification, touches: this.touches, last_handedness: old_h });
                }
                catch(err){
                    console.error(err);
                }
            }
        }
    }

    getSide() {
        return { classification: this.last_classification, touches: this.touches };
    }

    reset() {
        this.last_classification = { total: 0, count: 0, grade: 1 };
    }
}

class Vector2 {
    constructor(event, x, y) {
        this.x = x;
        this.y = y;

        if (Object.keys(event).length > 0) {
            if (event.touches[0]) {
                this.x = event.touches[0].clientX;
                this.y = event.touches[0].clientY;
            }
            if (event.changedTouches[0]) {
                this.x = event.changedTouches[0].clientX;
                this.y = event.changedTouches[0].clientY;
            }
        }
    }

    diff(b) {
        return new Vector2({}, this.positive(this.x - b.x), this.positive(this.y - b.y));
    }

    getFurther(b) {
        if (this.x >= b.x) {
            return this;
        }
        else {
            return b;
        }
    }

    positive(value) {
        if (value < 0) {
            return value * -1;
        }
        return value;
    }
}

export default Handedness;
