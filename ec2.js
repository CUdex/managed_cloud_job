// AWS SDK를 로드합니다.
const { EC2Client, DescribeInstancesCommand, StopInstancesCommand, TerminateInstancesCommand, DescribeVolumesCommand } = require("@aws-sdk/client-ec2");
// logger 로드
const logMessage = require('./logger');

// auto_stop 태그에 value가 enable이 아닌 경우 자동 중지
// EC2 서비스 객체 생성
const client = new EC2Client({ region: "ap-northeast-2" });

class ManageEC2 {

    constructor() {}

    // get instance list
    async getEC2List(trigger) {
        const command = new DescribeInstancesCommand({});

        if (trigger === 'stop') {
            command.input.Filters = [
                    {
                        Name: "instance-state-name",
                        Values: ["running"]
                    }
                ];
        }

        return client.send(command);
    }

    //get EBS Mount info
    async getVolumesDate(volumeId) {

        try {
            const describeVolumesCommand = new DescribeVolumesCommand({ VolumeIds: [volumeId] });
            const volumeData = await client.send(describeVolumesCommand);
            if (volumeData.Volumes.length > 0) {
              return new Date(volumeData.Volumes[0].CreateTime);
            }
            return null;
          } catch (error) {
            console.error(`Error retrieving volume ${volumeId}:`, error);
            return null;
          }
    }

    async stopEC2Instances() {
    
        try {
            // 중지 리스트 저장
            let stopInstanceList = new Array();
            const data = await this.getEC2List('stop');

            data.Reservations.forEach(reservation => {
                reservation.Instances.forEach(instance => {
                    const instanceId = instance.InstanceId;
                    const existTag = instance.Tags.find(tag => tag.Key === 'NO_AUTO_STOP');
                    if (!existTag || existTag.Value.toLowerCase() !== 'enable') {
                        stopInstanceList.push(instanceId);
                    }
                });
            });
            if (stopInstanceList.length > 0){
                await client.send(new StopInstancesCommand({ InstanceIds: stopInstanceList }));
                logMessage('info', `success stop instances: ${stopInstanceList} - reason(no tag: NO_AUTO_STOP)`, 'ec2.js');
            }
        } catch (error) {
            logMessage('error', `error: ${error}`, 'ec2.js');
        }
    }

    // 기간이 오래된 인스턴스 종료
    async terminateEC2Instances() {
        try {
            // EC2 인스턴스 목록 가져오기
            const instanceList = await this.getEC2List('terminate');
        
            let instancesToTerminate = new Array();
            const today = new Date();
        
            // 인스턴스 생성 날짜 확인 및 필터링
            for (const reservation of instanceList.Reservations) {
                for (const instance of reservation.Instances) {
                    if (instance.BlockDeviceMappings.length > 0) {
                        const volumeId = instance.BlockDeviceMappings[0].Ebs.VolumeId;
                        const volumeCreationDate = await this.getVolumesDate(volumeId);
            
                        if (volumeCreationDate) {
                            const ageInDays = Math.floor((today - volumeCreationDate) / (1000 * 60 * 60 * 24));
                            const existTag = instance.Tags.find(tag => tag.Key === 'NO_AUTO_TERMINATE');
                            // volume 100일이 넘거나 NO_AUTO_TERMINATE가 없으면 push
                            if (ageInDays > 100 && (!existTag || existTag.Value.toLowerCase() !== 'enable')) {
                                instancesToTerminate.push(instance.InstanceId);
                            }
                        }
                    }
                }
            }
            // 인스턴스 종료
            if (instancesToTerminate.length > 0) {
                // const terminateInstancesCommand = new TerminateInstancesCommand({
                //   InstanceIds: instancesToTerminate
                // });
                // await client.send(terminateInstancesCommand);
                logMessage('info', `success terminate instances: ${instancesToTerminate} - reason(no tag: NO_AUTO_TERMINATE and over days 100)`, 'ec2.js');
            } else {
                logMessage('info', 'No instances older than 100 days to terminate', 'ec2.js');
            }
          } catch (error) {
            logMessage('error', `Error terminating instances: ${error}`, 'ec2.js');
          }
        }
}

module.exports = ManageEC2;