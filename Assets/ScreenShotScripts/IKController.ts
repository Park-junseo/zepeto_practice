import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, Animator, AvatarIKGoal, Quaternion , Vector3, HumanBodyBones } from 'UnityEngine'
import { ZepetoCamera, ZepetoPlayers } from 'ZEPETO.Character.Controller';

export default class IKController extends ZepetoScriptBehaviour {

    // IK target of body and head
    private lookAtTarget: Transform;
    // rightHand's IK target
    private gripTarget: Transform;

    private bodySource: Transform;

    // Body and head weight setting for target
    // Controls how strongly the body reacts to the movement of the target
    private bodyWeight: number = 0.3;
    private headWeight: number = 0.7; 

    //Whether or not to apply IK
    private useIKWeight: boolean = false;
    private animator: Animator;

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

    // Set Target to look at and Grip to reach out
    public SetTargetAndGrip(lookAtTarget: Transform, gripTarget: Transform, bodySource: Transform) {
        this.lookAtTarget = lookAtTarget;
        this.gripTarget = gripTarget;
        this.bodySource = bodySource;
    }

    OnAnimatorIK(layerIndex: number) {

        // IK is not using IK, Third-person mode
        if(!this.useIKWeight) {
            return;
        }

        // When using IK, Selfie mode
        if (this.animator == null ||
            this.lookAtTarget == null ||
            this.gripTarget == null)
            return;

        // this.rightAramBones.forEach((bones)=>{
        //     this.animator.SetBoneLocalRotation(bones, this.ikRotation);
        // });

        // this.animator.SetBoneLocalRotation(HumanBodyBones.RightShoulder, Quaternion.Euler(new Vector3(174, -1, -85)));
        // this.animator.SetBoneLocalRotation(HumanBodyBones.UpperChest, Quaternion.Euler(new Vector3(4, 5, 0)));
        // this.animator.SetBoneLocalRotation(HumanBodyBones.Chest, Quaternion.Euler(new Vector3(3, 0, 0)));
        // const forward = ZepetoPlayers.instance.ZepetoCamera.cameraParent.forward;
        // forward.y = 0;

        // const look = ZepetoPlayers.instance.ZepetoCamera.cameraParent.position + forward*-3


        // Set the look weight when the body and head looks at the target. 
        this.animator.SetLookAtWeight(1, this.bodyWeight, this.headWeight);
        // set lookAt target
        this.animator.SetLookAtPosition(this.lookAtTarget.position);
        // this.animator.SetLookAtPosition(look);
        //this.animator.SetLookAtPosition(ZepetoPlayers.instance.ZepetoCamera.cameraParent.position);


        // console.log(`[IKController] ${ZepetoPlayers.instance.LocalPlayer.movingAxis.position.ToString()}`);
        // this.animator.SetIKRotationWeight(AvatarIKGoal.RightHand, 1);
        // this.animator.SetIKRotation(AvatarIKGoal.RightHand, this.gripTarget.rotation);//Quaternion.Euler(new Vector3(3,-3,3)));

        // this.animator.SetIKRotationWeight(AvatarIKGoal.RightHand, 1);
        // this.animator.SetIKRotation(AvatarIKGoal.RightHand, this.ikRotation);//Quaternion.Euler(new Vector3(3,-3,3)));

        // Set target weight for rightHand
        this.animator.SetIKPositionWeight(AvatarIKGoal.RightHand, 1);
        // Set the rightHand to Grip where it extends
        //this.animator.SetIKPosition(AvatarIKGoal.RightHand, this.gripTarget.position);

        this.animator.SetIKPosition(AvatarIKGoal.RightHand, this.gripTarget.position);
        // this.animator.SetIKPosition(AvatarIKGoal.RightHand, look+this.gripTarget.position);

        //console.log(`[OnAnimatorIK] ${this.gripTarget.gameObject.name}/${this.lookAtTarget.gameObject.name}: ${this.gripTarget.position.ToString()}/${this.lookAtTarget.position.ToString()}`);
    }

    LateUpdate() {
        this.ikRotation = Quaternion.FromToRotation(this.bodySource.position, this.gripTarget.position);
        // this.ikPosition = ZepetoPlayers.instance.ZepetoCamera.cameraParent.transform.position;
        // console.log(this.ikPosition.ToString());
        // this.animator.SetBoneLocalRotation(HumanBodyBones.Chest, Quaternion.Euler(new Vector3(3, 0, 0)));
    }
}
