declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		actions: MapSchema<Action>;
		jumpTriggers: MapSchema<Trigger>;
		landingPoints: MapSchema<LandingPoint>;
		selfieIKs: MapSchema<SelfieIK>;
		gestures: MapSchema<Gesture>;
	}
	class Vector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class Transform extends Schema {
		position: Vector3;
		rotation: Vector3;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoHash: string;
		zepetoUserId: string;
		transform: Transform;
		state: number;
		subState: number;
		expectedState: number;
		isSelfieIK: boolean;
	}
	class Action extends Schema {
		jumpTrigger: boolean;
	}
	class Trigger extends Schema {
		trigger: boolean;
	}
	class LandingPoint extends Schema {
		transform: Transform;
	}
	class SelfieIK extends Schema {
		isSelfie: boolean;
		lookAt: Vector3;
		targetAt: Vector3;
		selfieSession: string;
	}
	class Gesture extends Schema {
		clipIndex: number;
	}
}