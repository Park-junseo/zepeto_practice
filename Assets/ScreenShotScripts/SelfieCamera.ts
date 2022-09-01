import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Vector3, Transform, Mathf, Time, Quaternion, HideFlags, GameObject, Input, Application, Camera } from 'UnityEngine'
import { EventSystem } from 'UnityEngine.EventSystems';
import { Position } from 'UnityEngine.UIElements';
import { CharacterJumpState, CharacterMoveState, CharacterState, PlayerControlMode, ZepetoCharacter, ZepetoPlayerControl, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { TransformAccess } from 'UnityEngine.Jobs';
import ScreenShotModeManager from './ScreenShotModeManager';
export default class SelfieCamera extends ZepetoScriptBehaviour {
    
    public rightOffset: number = 0.25;
    public distance: number = 0.7;
    public height: number = 0.893;
    public xMouseSensitivity: number = 12;
    public yMouseSensitivity: number = 12;
    public yMinLimit: number = -20;
    public yMaxLimit: number = 40;
    public smoothCameraRotation: number = 10;

    public grip: GameObject;
    private currentTarget: Transform;
    private targetLookAt: Transform;
    private currentTargetPos: Vector3;
    private currentPos: Vector3;
    private xMinLimit: number = -180;
    private xMaxLimit: number = 180;
    private rotateX: number = 0;
    private rotateY: number = 0;

    private worldCamaraParent: Transform;
    private worldCameralookAxias: Quaternion;

    private zepetoCharacter:ZepetoCharacter;
    private initialWalkSpeed:number;
    private initialRunSpeed:number;
    private initialRunThreshold:number;
    private initialJumpDashSpeedThreshold:number;

    private camera: Camera;
    private isActive: boolean = false;

    public GetGripObject() :GameObject {
        return this.grip;
    }

    public RotateCamera(x: number, y: number) {
        this.SetCameraRotation(this.rotateX + x * this.xMouseSensitivity, this.rotateY - y * this.yMouseSensitivity);
    }

    public SetCameraRotation(x: number, y: number) {
        this.rotateX = this.ClampAngle(x, this.xMinLimit, this.xMaxLimit);
        this.rotateY = this.ClampAngle(y, this.yMinLimit, this.yMaxLimit);
    }

    private ClampAngle(angle: number, min: number, max: number): number {

        if (angle < -180) {
            angle += 360;
        }

        if (angle > 180) {
            angle -= 360;
        }

        return Mathf.Clamp(angle, min, max);
    }


    private CameraMovement() {
        if (this.currentTarget == null)
            return;

        let newRot: Quaternion = Quaternion.Euler(this.rotateY, this.rotateX, 0);
        this.targetLookAt.rotation = Quaternion.Slerp(this.targetLookAt.rotation, newRot, this.smoothCameraRotation * Time.deltaTime);

        var camDir: Vector3 = Vector3.op_Addition(Vector3.op_Multiply(this.targetLookAt.forward,-1),Vector3.op_Multiply(this.targetLookAt.right,this.rightOffset));
        camDir = camDir.normalized;

        var targetPos = new Vector3(this.currentTarget.position.x, this.currentTarget.position.y, this.currentTarget.position.z);
        this.currentTargetPos = targetPos;

        this.currentPos = Vector3.op_Addition(this.currentTargetPos,new Vector3(0, this.height, 0));

        this.targetLookAt.position = this.currentPos;
        this.transform.position = Vector3.op_Addition(this.currentPos,Vector3.op_Multiply(camDir,this.distance)) ;

        var lookPoint: Vector3 = Vector3.op_Addition(this.currentPos,Vector3.op_Multiply(this.targetLookAt.forward,2)) ;
        lookPoint = Vector3.op_Addition(lookPoint,Vector3.op_Multiply(this.targetLookAt.right,Vector3.Dot(Vector3.op_Multiply(camDir,(this.distance)), this.targetLookAt.right)));


        let subtractionVec = new Vector3(lookPoint.x - this.transform.position.x,
            lookPoint.y - this.transform.position.y,
            lookPoint.z - this.transform.position.z);
        var rotation = Quaternion.LookRotation(subtractionVec);

        this.transform.rotation = rotation;

        //this.currentTarget.LookAt(this.transform);
        //this.currentTarget.eulerAngles = new Vector3(0, this.currentTarget.eulerAngles.y, 0);
        
        var lookAxisRot = Quaternion.LookRotation(Vector3.op_Multiply(subtractionVec,-1));
        var projRot = Vector3.ProjectOnPlane(lookAxisRot.eulerAngles, Vector3.right);

        this.currentTarget.rotation = Quaternion.Euler(Vector3.op_Addition(projRot,ScreenShotModeManager.GetInstance().fixSelfieBodyRotation));

        //console.log(`[SelfieCamera] ${this.currentTarget.rotation.eulerAngles.ToString()}`)

        var lookAxisRot = Quaternion.LookRotation(subtractionVec);

        this.worldCamaraParent.rotation = lookAxisRot;
        //ZepetoPlayers.instance.ZepetoCamera.rotation.eulerAngles = (subtractionVec);



    }

    public InitSetting(player: ZepetoCharacter) { // 플레이어 transfrom
        this.zepetoCharacter = player;
        this.currentTarget = player.transform;

        this.currentTargetPos = new Vector3(this.currentTarget.position.x, this.currentTarget.position.y, this.currentTarget.position.z);

        this.worldCamaraParent = ZepetoPlayers.instance.ZepetoCamera.cameraParent;

        // if (this.targetLookAt != null) {

        //     GameObject.Destroy(this.targetLookAt.gameObject);
        // }

        // this.targetLookAt = this.targetLookAt || new GameObject("targetLookAt").transform;
        // this.targetLookAt.position = this.currentTarget.position;
        // this.targetLookAt.hideFlags = HideFlags.HideInHierarchy;
        // this.targetLookAt.rotation = this.currentTarget.rotation;

        // this.rotateY = this.currentTarget.eulerAngles.x;
        // this.rotateX = this.currentTarget.eulerAngles.y;

    }

    CameraInput() {

        if (!Input.GetMouseButton(0) || Input.touchCount >= 2) {
            return;
        }

        if (EventSystem.current.IsPointerOverGameObject()) 
            return;

        let X: number = 0;
        let Y: number = 0;

        if (!Application.isEditor) {
            Y = Input.touches[0].deltaPosition.y;;
            X = Input.touches[0].deltaPosition.x;
        } else {
            Y = Input.GetAxis("Mouse Y");
            X = Input.GetAxis("Mouse X");
        }

        this.RotateCamera(X, Y);
    }

    private SettingZepetoPlayer () {
        if(this.zepetoCharacter.CurrentState === CharacterState.Move)
            this.zepetoCharacter.ChangeStateAnimation(CharacterState.Move, CharacterMoveState.MoveWalk);
        else if (this.zepetoCharacter.CurrentState === CharacterState.Jump && 
        this.zepetoCharacter.MotionV2.CurrentJumpState !== CharacterJumpState.JumpIdle) {
            this.zepetoCharacter.ChangeStateAnimation(CharacterState.Jump, CharacterJumpState.JumpMove);
        } else
            this.zepetoCharacter.SyncStateAnimation();
    }

    Awake() {
        this.camera = this.GetComponent<Camera>();
    }

    OnEnable() {        

    }

    OnDisable() {

    }
    // LateUpdate() {

    //     if (this.currentTarget == null || this.targetLookAt == null)
    //         return;

    //     this.CameraInput();
    //     this.CameraMovement();
    //     this.worldCameraSetting();
    // }

    private* UpdateBeforeIK() {
        while(this.isActive) {
            if (this.currentTarget == null || this.targetLookAt == null)
            return;
            this.CameraInput();
            this.CameraMovement();
            //this.SettingZepetoPlayer();
            
            yield null;
        }
    }

    public SetActiveCam(active:boolean) {
        if(this.isActive === active) return;

        this.isActive = active;
        this.gameObject.SetActive(active);
        if(active) {
            if(this.currentTarget) {
                this.targetLookAt = this.targetLookAt || new GameObject("targetLookAt").transform;
    
                this.targetLookAt.position = this.currentTarget.position;
                this.targetLookAt.hideFlags = HideFlags.HideInHierarchy;
    
                this.rotateY = 15;
                this.rotateX = this.currentTarget.eulerAngles.y - 180;
    
                this.targetLookAt.rotation = Quaternion.Euler(this.rotateY, this.rotateX, 0);//this.currentTarget.rotation;
    
                //const inverse = this.currentTarget.forward;
                //const inverse = Quaternion.Inverse(this.currentTarget.rotation).eulerAngles;
                // const inverse = Quaternion.Euler(this.currentTarget.eulerAngles * -1).eulerAngles;
    
                // this.rotateX = this.currentTarget.rotation.eulerAngles.x;
                // this.rotateY = this.currentTarget.rotation.eulerAngles.y;
                // this.rotateX = this.currentTarget.rotation.eulerAngles.x;
                // this.rotateY = this.currentTarget.rotation.eulerAngles.y;
    
                //const inverse = Quaternion.Inverse(this.currentTarget.rotation).eulerAngles;
    
                // this.rotateY = this.currentTarget.eulerAngles.x;
                // this.rotateX = this.currentTarget.eulerAngles.y;
    
                this.initialWalkSpeed = ZepetoPlayers.instance.characterData.walkSpeed;
                this.initialRunSpeed = ZepetoPlayers.instance.characterData.runSpeed;
                this.initialRunThreshold = ZepetoPlayers.instance.motionV2Data.runThreshold;
                this.initialJumpDashSpeedThreshold = ZepetoPlayers.instance.motionV2Data.jumpDashSpeedThreshold;
                // ZepetoPlayers.instance.characterData.runSpeed = 2;
                // ZepetoPlayers.instance.controllerData.controlMode = PlayerControlMode.WalkOnly;

                //////////////////////////
                // ZepetoPlayers.instance.motionV2Data.runThreshold = 10;
                // ZepetoPlayers.instance.characterData.walkSpeed = 1;
                // ZepetoPlayers.instance.characterData.runSpeed = ZepetoPlayers.instance.characterData.walkSpeed;
                // ZepetoPlayers.instance.motionV2Data.jumpDashSpeedThreshold = 10//ZepetoPlayers.instance.characterData.walkSpeed;

                ZepetoPlayers.instance.controllerData.controlMode = PlayerControlMode.WalkOnly;

                this.StopAllCoroutines();
                this.StartCoroutine(this.UpdateBeforeIK());
            }
        } else {
            //this.StopAllCoroutines();

            this.zepetoCharacter.SyncStateAnimation();
            // ZepetoPlayers.instance.characterData.runSpeed = this.initialRunSpeed;
            // ZepetoPlayers.instance.controllerData.controlMode = PlayerControlMode.Default;

            // //////////////////////////////////
            // ZepetoPlayers.instance.motionV2Data.runThreshold = this.initialRunThreshold;
            // ZepetoPlayers.instance.characterData.walkSpeed = this.initialWalkSpeed;
            // ZepetoPlayers.instance.characterData.runSpeed = this.initialRunSpeed;
            // ZepetoPlayers.instance.motionV2Data.jumpDashSpeedThreshold = this.initialJumpDashSpeedThreshold;

            this.currentTarget.rotation = Quaternion.Euler(Vector3.op_Subtraction(this.currentTarget.eulerAngles,ScreenShotModeManager.GetInstance().fixSelfieBodyRotation));
        }

        if(this.zepetoCharacter) this.zepetoCharacter.ZepetoAnimator.SetBool("SelfieMode", active);
    }

    public GetCamera() {
        return this.camera;
    }

    // Update() {
    //     if (this.currentTarget == null || this.targetLookAt == null)
    //         return;
    //     this.worldCameraSetting();


    // }
}