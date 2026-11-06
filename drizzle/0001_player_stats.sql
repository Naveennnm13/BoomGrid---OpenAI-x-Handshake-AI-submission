CREATE TABLE `profiles` (`profile_id` text PRIMARY KEY NOT NULL,`display_name` text NOT NULL,`public` integer DEFAULT 1 NOT NULL,`created_at` integer NOT NULL,`updated_at` integer NOT NULL);
CREATE TABLE `matches` (`match_id` text PRIMARY KEY NOT NULL,`room_code` text NOT NULL,`practice` integer DEFAULT 0 NOT NULL,`finished_at` integer NOT NULL,`rounds` integer NOT NULL,`seats` integer NOT NULL);
CREATE TABLE `match_players` (`match_id` text NOT NULL,`profile_id` text NOT NULL,`seat` integer NOT NULL,`won` integer DEFAULT 0 NOT NULL,`hits` integer DEFAULT 0 NOT NULL,`shots` integer DEFAULT 0 NOT NULL,`numbers_lost` integer DEFAULT 0 NOT NULL,`picks` text NOT NULL,`powers_used` text NOT NULL,PRIMARY KEY(`match_id`,`profile_id`));
CREATE TABLE `number_stats` (`grid_size` integer NOT NULL,`number` integer NOT NULL,`chosen` integer DEFAULT 0 NOT NULL,`survived` integer DEFAULT 0 NOT NULL,`called` integer DEFAULT 0 NOT NULL,`hits` integer DEFAULT 0 NOT NULL,PRIMARY KEY(`grid_size`,`number`));
CREATE TABLE `clutch_plays` (`id` text PRIMARY KEY NOT NULL,`match_id` text NOT NULL,`profile_id` text NOT NULL,`kind` text NOT NULL,`round` integer NOT NULL,`detail` text NOT NULL,`created_at` integer NOT NULL);
CREATE INDEX `match_players_profile_idx` ON `match_players` (`profile_id`);
CREATE INDEX `clutch_created_idx` ON `clutch_plays` (`created_at`);
