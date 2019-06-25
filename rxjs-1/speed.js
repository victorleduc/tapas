const Rx = require('rxjs');
const RxOps = require('rxjs/operators');

const { getRace } = require('./race');
const race = getRace();

const carName = `Lightning McQueen`;

const getCarSpeed = (race, carName) => {

    const completeWindow$ = new Rx.Subject();
    let foundLast = false;
    let startTime = 0;

    return Rx.fromEvent(race, 'data', (car) => car)
        .pipe(
            RxOps.filter((car) => car.carName === carName),
            RxOps.tap((car) => {
                if (foundLast) {
                    completeWindow$.next(true);
                    startTime = car.time;
                    foundLast = false;
                } else if (car.time > startTime + 200) {
                    foundLast = true;
                }
            }),
            RxOps.bufferWhen(() => completeWindow$.pipe(RxOps.filter((a) => !!a))),
            RxOps.map((windowData) => {
                const firstData = windowData[0];
                const lastData = windowData[windowData.length - 1];
                const speed = 1000 * (
                    (lastData.xLocation - firstData.xLocation) /
                    (lastData.time - firstData.time)
                );
                return speed.toFixed(2);
            })
        );
};

const speed$ = getCarSpeed(race, carName);

// adding `\r` allows to overwrite the message in the same line
speed$.subscribe(speed => process.stdout.write(`Speed: ${speed}m/s\r`));

race.start();