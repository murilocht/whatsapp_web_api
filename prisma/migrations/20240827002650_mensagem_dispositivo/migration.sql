-- CreateTable
CREATE TABLE `dispositivo` (
    `dispositivo_id` INTEGER NOT NULL AUTO_INCREMENT,
    `dispositivo_nome` VARCHAR(255) NOT NULL,
    `dispositivo_sessao` LONGTEXT NULL,
    `dispositivo_qrcode` TEXT NULL,
    `dispositivo_status` VARCHAR(255) NULL,
    `dispositivo_tentativas` INTEGER NULL,

    PRIMARY KEY (`dispositivo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagem` (
    `mensagem_id` VARCHAR(191) NOT NULL,
    `mensagem_jid` VARCHAR(255) NULL,
    `mensagem_nome` VARCHAR(255) NULL,
    `mensagem_corpo` TEXT NULL,

    UNIQUE INDEX `mensagem_mensagem_id_key`(`mensagem_id`),
    PRIMARY KEY (`mensagem_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
