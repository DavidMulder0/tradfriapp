import { discoverGateway } from 'node-tradfri-client'
import { TradfriClient, Accessory, AccessoryTypes } from 'node-tradfri-client'
import express from 'express'
const URL = require('url')

const app = express()

console.log(new URL.URL('coaps://10.10.10.10').hostname)
;(async () => {
    const result = await discoverGateway()
    if (result) {
        console.log('going to create client', result)
        const tradfri = new TradfriClient(result.addresses[0])
        console.log('going to get authentication')
        const { identity, psk } = await tradfri.authenticate('5IvBIDxm0zCApGzh')
        console.log('going to connect', identity, psk)
        const connect = await tradfri.connect(identity, psk)
        console.log('connected', connect)
        const success = await tradfri.ping(1000)
        tradfri
            .on('device updated', tradfri_deviceUpdated)
            .on('device removed', tradfri_deviceRemoved)
            .observeDevices()
        tradfri.observeGroupsAndScenes()

        const lightbulbs: { [s: string]: Accessory } = {}
        function tradfri_deviceUpdated(device: Accessory) {
            if (device.type === AccessoryTypes.lightbulb) {
                console.log('lightbulb found', device.name, device.instanceId)
                // remember it
                console.log(device.lightList[0].onOff)
                // console.log(device.)
                lightbulbs[device.instanceId] = device
            }
        }

        function tradfri_deviceRemoved(instanceId: number) {
            // clean up
        }

        setTimeout(() => {
            console.log(tradfri.groups)
            const light = lightbulbs[65538].lightList[0]
            // light.toggle();
        }, 1000)

        console.log(result)
        app.use('/', express.static('./static'))
        app.get('/groups', (req, res) => {
            const groups = Object.values(tradfri.groups).map(
                (group) => group.group
            )
            res.send(
                groups.map((group) => ({
                    name: group.name,
                    lights: group.deviceIDs
                        .map((id) => tradfri.devices[id])
                        .filter(
                            (device) => device.type === AccessoryTypes.lightbulb
                        )
                        .map((device) => {
                            return {
                                name: device.name,
                                onOff: device.lightList[0].onOff,
                            }
                        }),
                }))
            )
        })
        app.get('/group/:name', (req, res) => {
            const group = Object.values(tradfri.groups).find(
                (group) =>
                    group.group.name.toLowerCase() ===
                    req.params.name.toLowerCase()
            )

            res.send(group.group.name)
        })
        app.get('/group/:name/:state', (req, res) => {
            const group = Object.values(tradfri.groups).find(
                (group) =>
                    group.group.name.toLowerCase() ===
                    req.params.name.toLowerCase()
            ).group
            ;(<any>group).client = tradfri
            if (req.params.state === 'on') {
                group.turnOn()
            } else {
                group.turnOff()
            }
            res.send(group.name)
        })
        app.listen(19319)
    }
})()
