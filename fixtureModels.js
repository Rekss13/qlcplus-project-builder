import { FixtureManufacturer, FixtureModel, FixtureMode } from "./fixtureType.js";

const FixtureModels = Object.freeze({
    GENERIC: {
        genericRGB: {
            rgb: {
                manufacturer: FixtureManufacturer.GENERIC,
                model: FixtureModel.GENERIC.rgb,
                mode: FixtureMode.rgb,
                addresses: 3,
            },
            grb: {
                manufacturer: FixtureManufacturer.GENERIC,
                model: FixtureModel.GENERIC.rgb,
                mode: FixtureMode.grb,
                addresses: 3,
            },
            bgr: {
                manufacturer: FixtureManufacturer.GENERIC,
                model: FixtureModel.GENERIC.rgb,
                mode: FixtureMode.bgr,
                addresses: 3,
            },
            rgbDimmer: {
                manufacturer: FixtureManufacturer.GENERIC,
                model: FixtureModel.GENERIC.rgb,
                mode: FixtureMode.rgbDimmer,
                addresses: 4,
            },
            dimmerRgb: {
                manufacturer: FixtureManufacturer.GENERIC,
                model: FixtureModel.GENERIC.rgb,
                mode: FixtureMode.dimmerRgb,
                addresses: 4,
            }
        }
    }
});

export default FixtureModels;