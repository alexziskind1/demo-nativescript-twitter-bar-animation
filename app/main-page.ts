/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page";
import { View } from 'tns-core-modules/ui/core/view';
import { HelloWorldModel } from "./main-view-model";
import { ScrollView } from 'tns-core-modules/ui/scroll-view';
import { Animation, AnimationDefinition, CubicBezierAnimationCurve } from 'tns-core-modules/ui/animation';
import { SwipeGestureEventData, SwipeDirection, PanGestureEventData, GestureStateTypes } from "tns-core-modules/ui/gestures/gestures";

let wrapperLayout: View = undefined;
let scrollView: ScrollView = undefined;
let bar: View = undefined;

const minStretch = 0;
const maxStretch = 40;
const animDuration = 250;
let animation: Animation = undefined;
let prevTranslateY = 0;
let prevScale = 0;

export function onWrapperLoaded(args: EventData) {
    wrapperLayout = args.object as View;
    const page = wrapperLayout.page;

    scrollView = page.getViewById('scrollView') as ScrollView;
    bar = page.getViewById('bar') as View;

    bar.eachChildView((v: View) => {
        v.opacity = 0;
        return true;
    });

    bar.translateY = bar.translateY - maxStretch;
    bar.height = maxStretch;

    scrollView.marginTop = -1 * maxStretch;


    scrollView.on('pan', (args: PanGestureEventData) => {
        if (args.state === GestureStateTypes.began) {
            if (animation && animation.isPlaying) {
                animation.cancel();
                const newY = scrollView.translateY - prevTranslateY;
                if (newY >= minStretch && newY <= maxStretch) {
                    scrollView.translateY = newY;
                    bar.translateY = newY - maxStretch;
                }
            } else {
                prevTranslateY = 0;
            }
        } else if (args.state === GestureStateTypes.changed) {
            if (args.deltaY < 0) {
                let newY = scrollView.translateY + args.deltaY - prevTranslateY;
                scrollView.translateY = newY;
                prevTranslateY = args.deltaY;
                prevScale = getScale(maxStretch, newY);

                bar.eachChildView((v: View) => {
                    v.opacity = prevScale;
                    return true;
                });

                if (newY <= maxStretch && newY >= minStretch) {
                    bar.translateY = newY - maxStretch;
                }
            }
        } else if (args.state === GestureStateTypes.ended) {
            if (args.deltaY < 0) {

                let transY = maxStretch;
                if (args.deltaY < maxStretch / 2) {
                    transY = minStretch;
                }

                const def1: AnimationDefinition = {
                    target: scrollView,
                    duration: animDuration,
                    translate: { x: 0, y: transY },
                    curve: new CubicBezierAnimationCurve(.18, .52, 0, 1)
                };

                const def2: AnimationDefinition = {
                    target: bar,
                    duration: animDuration,
                    translate: { x: 0, y: transY - maxStretch },
                    curve: new CubicBezierAnimationCurve(.18, .52, 0, 1)
                };

                const childDefs: AnimationDefinition[] = [];
                bar.eachChildView((v: View) => {
                    const def3: AnimationDefinition = {
                        target: v,
                        duration: animDuration,
                        opacity: transY === maxStretch ? 1 : 0
                    };
                    childDefs.push(def3);
                    return true;
                });

                animation = new Animation([def1, def2, ...childDefs]);
                animation.play();
            }
        }
    });

    scrollView.on('swipe', (args: SwipeGestureEventData) => {
        if (animation && animation.isPlaying) {
            animation.cancel();
        }
        if (args.direction === SwipeDirection.down) {

            const def1: AnimationDefinition = {
                target: bar,
                duration: animDuration,
                translate: { x: 0, y: minStretch },
                curve: new CubicBezierAnimationCurve(.18, .52, 0, 1)
            };
            const def2: AnimationDefinition = {
                target: scrollView,
                duration: animDuration,
                translate: { x: 0, y: maxStretch },
                curve: new CubicBezierAnimationCurve(.18, .52, 0, 1)
            };
            const childDefs: AnimationDefinition[] = [];
            bar.eachChildView((v: View) => {
                const def3: AnimationDefinition = {
                    target: v,
                    duration: animDuration * 2,
                    opacity: 1
                };
                childDefs.push(def3);
                return true;
            });

            animation = new Animation([def1, def2, ...childDefs]);
            animation.play();
        }
    });
}

function getScale(fullDen: number, partNum: number) {
    return partNum / fullDen;
}


// Event handler for Page "navigatingTo" event attached in main-page.xml
export function navigatingTo(args: EventData) {
    /*
    This gets a reference this page’s <Page> UI component. You can
    view the API reference of the Page to see what’s available at
    https://docs.nativescript.org/api-reference/classes/_ui_page_.page.html
    */
    const page = <Page>args.object;

    /*
    A page’s bindingContext is an object that should be used to perform
    data binding between XML markup and TypeScript code. Properties
    on the bindingContext can be accessed using the {{ }} syntax in XML.
    In this example, the {{ message }} and {{ onTap }} bindings are resolved
    against the object returned by createViewModel().

    You can learn more about data binding in NativeScript at
    https://docs.nativescript.org/core-concepts/data-binding.
    */
    page.bindingContext = new HelloWorldModel();
}

