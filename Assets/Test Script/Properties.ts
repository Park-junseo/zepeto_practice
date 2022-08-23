///import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Vector3, GameObject, Transform} from 'UnityEngine'

export default class Properties extends ZepetoScriptBehaviour {

    public floatValue: float;
    public intValue: int;
    public strValue: string;

    public vectorValue:Vector3;

    public gameObjectValue: GameObject;
    public transformValue: Transform;

    public floatValues: float[];

    // Serialize�� ���ʿ��� public Property
    @NonSerialized()
    public strValue1:string;
 
    // Inspector �� �����ϰ� ���� ���� Property
    @HideInInspector()
    public strValue2:string;
 
    // Serialize�� �ʿ��� private Property
    @SerializeField()
    private strValue3:string;
 
    // Property ���� ��� �߰�
    @Header("Header Title")
    public stringProperty: string;
 
    // Property �� ���� �߰�
    @Space(10)
    public transformProperty: Transform;
 
    // Property�� ���콺�� ��ġ�ϴ� ��� ��Ÿ���� ���� �߰�
    @Tooltip("This is Tooltip")
    public numberProperty: number;

    Update() 
    {
        //console.log(`floatValue : ${this.floatValue}`);
        //console.log(`strValue : ${this.strValue}`);
        // rotate cube a
        if(this.gameObjectValue)
        {
            var transform = this.gameObjectValue.GetComponent<Transform>();
            transform.Rotate(this.vectorValue * 2);
        }
        else {
            console.warn("null gameobject");
        }
        
        // rotate cube b
        if(this.transformValue)
        {
            this.transformValue.Rotate(this.vectorValue);
        }
        else
        {
            console.warn("null transform");
        }
      
        
    }

}