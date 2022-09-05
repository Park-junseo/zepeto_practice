import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, Animator, AvatarIKGoal, Quaternion , Vector3, HumanBodyBones } from 'UnityEngine'
import { ZepetoCamera, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import PlayerIKController from '../Multiplay Script/PlayerIKController';
import ClientStarterV2 from '../Multiplay Script/ClientStarterV2';

export default class IKController extends ZepetoScriptBehaviour {

    // IK target of body and head
    private lookAtTarget: Transform;
    // rightHand's IK target
    private gripTarget: Transform;

    private bodySource: Transform;

    // Body and head weight setting for target
    // Controls how strongly the body reacts to the movement of the target
    public static readonly bodyWeight: number = 0.3;
    public static readonly headWeight: number = 0.7; 

    //Whether or not to apply IK
    private useIKWeight: boolean = false;
    private animator: Animator;

    //SelfieWith
    private useSelfieWIthIKWeight: boolean = false;
    private targetPlayerIK: PlayerIKController;

    public static readonly bodyLightWeight: number = 0.1;
    public static readonly headLightWeight: number = 0.7; 
    

    private ikRotation: Quaternion;
    private ikPosition: Vector3;

    private rightAramBones = [
        //HumanBodyBones.RightHand,
        HumanBodyBones.RightLowerArm,
        HumanBodyBones.RightUpperArm,
        //HumanBodyBones.RightShoulder,

    ]

    Start() {
        this.animator = this.GetComponent<Animator>();
        //Disable IK weight initially, and use it when changing to selfie mode
        this.SetIKWeightActive(false);
    }

    //Toggle IK weight on/off
    public SetIKWeightActive(active: boolean) {
        this.useIKWeight = active;
    }

    public SetSelfieWithIKActive(active: boolean) {
        this.useSelfieWIthIKWeight = active;
    }

    // Set Target to look at and Grip to reach out
    public SetTargetAndGrip(lookAtTarget: Transform, gripTarget: Transform, bodySource: Transform) {
        this.lookAtTarget = lookAtTarget;
        this.gripTarget = gripTarget;
        this.bodySource = bodySource;
    }

    public SetPlayerIK(playerIKController: PlayerIKController) {
        this.targetPlayerIK = playerIKController;
    }

    private OnSelfieCamera() {
        // IK is not using IK, Third-person mode
        if(!this.useIKWeight) {
            return;
        }

        // When using IK, Selfie mode
        if (this.animator == null ||
            this.lookAtTarget == null ||
            this.gripTarget == null)
            return;


        // Set the look weight when the body and head looks at the target. 
        this.animator.SetLookAtWeight(1, IKController.bodyWeight, IKController.headWeight);
        // set lookAt target
        this.animator.SetLookAtPosition(this.lookAtTarget.position);

        // Set target weight for rightHand
        this.animator.SetIKPositionWeight(AvatarIKGoal.RightHand, 1);
        // Set the rightHand to Grip where it extends
        //this.animator.SetIKPosition(AvatarIKGoal.RightHand, this.gripTarget.position);

        this.animator.SetIKPosition(AvatarIKGoal.RightHand, this.gripTarget.position);
        // this.animator.SetIKPosition(AvatarIKGoal.RightHand, look+this.gripTarget.position);

        //console.log(`[OnAnimatorIK] ${this.gripTarget.gameObject.name}/${this.lookAtTarget.gameObject.name}: ${this.gripTarget.position.ToString()}/${this.lookAtTarget.position.ToString()}`);
    }

    private OnSelfieWith() {
        if(!this.useSelfieWIthIKWeight) {
            return;
        }

        // When using IK, Selfie mode
        if (this.animator == null ||
            this.targetPlayerIK === null ||
            !this.targetPlayerIK.isSelfie)
            return;

        // Set the look weight when the body and head looks at the target. 
        this.animator.SetLookAtWeight(1, IKController.bodyLightWeight, IKController.headLightWeight);
        // set lookAt target
        this.animator.SetLookAtPosition(this.targetPlayerIK.lookAtVector);        
    }

    OnAnimatorIK(layerIndex: number) {
        this.OnSelfieCamera();
        this.OnSelfieWith();
    }

    // LateUpdate() {
    //     this.ikRotation = Quaternion.FromToRotation(this.bodySource.position, this.gripTarget.position);
    //     // this.ikPosition = ZepetoPlayers.instance.ZepetoCamera.cameraParent.transform.position;
    //     // console.log(this.ikPosition.ToString());
    //     // this.animator.SetBoneLocalRotation(HumanBodyBones.Chest, Quaternion.Euler(new Vector3(3, 0, 0)));
    // }

    public StartSelfieWith(isSelfieWith:boolean, sessionId:string) {
        this.useSelfieWIthIKWeight = isSelfieWith;
        this.targetPlayerIK = (isSelfieWith)? ClientStarterV2.Instance.CurPlayerControlStates.get(sessionId).playerIK : null;
    }

    public GetLookAtTransform() {return this.lookAtTarget; }
    public GetTargetAtTransform() {return this.gripTarget; }

    // public get bodyWeight() {return this._bodyWeight;}
    // public get headWeight() {return this._headWeight;}

    public GetLookAtAndTargetAt() {
        return [
            this.lookAtTarget.position,
            this.gripTarget.position
        ];
    }
}
