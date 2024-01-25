# managed_cloud_job

1. nodejs를 활용한 aws 자동 자원 관리
2. ec2, iam 등을 확인하여 특정 태그가 없는 자원 혹은 오래된 자원은 자동 삭제 및 중지

require npm: @aws-sdk/client-ec2, winston, winston-daily-rotate-file @aws-sdk/client-iam