import React, { PureComponent } from 'react';
import styled from 'styled-components';
import get from 'lodash.get';
import controller from '../../lib/controller';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE
} from '../../constants';

const Container = styled.div`
    padding: 10px;
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-top: 10px;
`;

const Button = styled.button`
    flex: 1;
    padding: 10px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: ${props => props.$active ? '#007bff' : '#f8f9fa'};
    color: ${props => props.$active ? '#fff' : '#333'};
    opacity: ${props => props.disabled ? 0.5 : 1};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

    &:hover:not(:disabled) {
        background-color: ${props => props.$active ? '#0056b3' : '#e2e6ea'};
    }
`;

const StatusText = styled.div`
    margin-bottom: 10px;
    font-size: 14px;
    color: #555;
`;

const ModeIndicator = styled.span`
    font-weight: bold;
    color: ${props => props.$mode === 'Laser' ? '#d9534f' : '#5bc0de'};
`;

class App extends PureComponent {
    state = {
        port: controller.port,
        controller: {
            type: controller.type,
            state: controller.state
        },
        currentMode: 'Spindel' // Default mode
    };

    controllerEvent = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            this.setState({ port: '', controller: { type: '', state: {} } });
        },
        'controller:state': (controllerType, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: controllerType,
                    state: controllerState
                }
            }));
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    addControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    switchToLaser = () => {
        if (!this.canSwitch()) return;

        // Laser Mode Settings ($32=1)
        const commands = [
            '$32=1', // Laser mode enabled
            '$30=1000', // Max spindle speed (S1000)
            '$110=5000', // X-axis max rate
            '$111=5000', // Y-axis max rate
            '$120=500', // X-axis acceleration
            '$121=500'  // Y-axis acceleration
        ];

        commands.forEach(cmd => controller.writeline(cmd));
        this.setState({ currentMode: 'Laser' });
    };

    switchToSpindel = () => {
        if (!this.canSwitch()) return;

        // Spindel Mode Settings ($32=0)
        const commands = [
            '$32=0', // Laser mode disabled
            '$30=24000', // Max spindle speed
            '$110=2000', // X-axis max rate
            '$111=2000', // Y-axis max rate
            '$120=100', // X-axis acceleration
            '$121=100'  // Y-axis acceleration
        ];

        commands.forEach(cmd => controller.writeline(cmd));
        this.setState({ currentMode: 'Spindel' });
    };

    canSwitch = () => {
        const { port, controller: { type, state } } = this.state;
        if (!port || type !== GRBL) return false;

        const activeState = get(state, 'status.activeState');
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    };

    render() {
        const { port, controller: { type, state }, currentMode } = this.state;
        const activeState = get(state, 'status.activeState');
        const isIdle = activeState === GRBL_ACTIVE_STATE_IDLE;
        const isGrbl = type === GRBL;
        const canSwitch = port && isGrbl && isIdle;

        if (!port) {
            return (
                <Container style={{ color: '#333', opacity: '.65' }}>
                    No serial connection
                </Container>
            );
        }

        if (!isGrbl) {
            return (
                <Container style={{ color: '#d9534f' }}>
                    Only Grbl controller is supported.
                </Container>
            );
        }

        return (
            <Container>
                <StatusText>
                    Status: <strong>{activeState || 'Unknown'}</strong>
                </StatusText>
                <StatusText>
                    Current Mode: <ModeIndicator $mode={currentMode}>{currentMode}</ModeIndicator>
                </StatusText>
                {!isIdle && (
                    <StatusText style={{ color: '#d9534f', fontSize: '12px' }}>
                        * Switching only allowed in Idle state.
                    </StatusText>
                )}
                <ButtonGroup>
                    <Button
                        $active={currentMode === 'Spindel'}
                        disabled={!canSwitch}
                        onClick={this.switchToSpindel}
                    >
                        Spindel Mode
                    </Button>
                    <Button
                        $active={currentMode === 'Laser'}
                        disabled={!canSwitch}
                        onClick={this.switchToLaser}
                    >
                        Laser Mode
                    </Button>
                </ButtonGroup>
            </Container>
        );
    }
}

export default App;
